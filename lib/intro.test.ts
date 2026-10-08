import { describe, expect, it } from "vitest";
import { CHARACTER_LAYERS } from "./character/stage";
import {
  INTRO_BUDGET_MS,
  INTRO_SEEN_KEY,
  PHONE_FACTOR,
  MIN_TAIL_FACTOR,
  SKIP_EVENTS,
  chooseIntro,
  fitTail,
  fullTimeline,
  introScript,
  isBotAgent,
  loadProgress,
  shortTimeline,
  type ModeInput,
} from "./intro";

describe("fullTimeline", () => {
  it.each([1, 4, 8])("fits 2.8 s on desktop with %i files, leaving time to load", (files) => {
    const t = fullTimeline({ phone: false, files });
    expect(t.deadline + t.tail).toBeLessThanOrEqual(INTRO_BUDGET_MS.full);
    expect(t.deadline).toBeGreaterThanOrEqual(t.draw);
    expect(t.draw).toBeGreaterThan(600);
  });

  it("waits for the living character only as long as a squeezed tail still fits", () => {
    const t = fullTimeline({ phone: false, files: 4 });
    expect(t.wait).toBeGreaterThan(t.deadline);
    const late = fitTail(t, t.wait);
    expect(t.wait + late.tail).toBeLessThanOrEqual(t.budget + 5);
    expect(late.develop).toBeGreaterThanOrEqual(600);
  });

  it("is 30 % shorter on phones", () => {
    const desk = fullTimeline({ phone: false, files: 4 });
    const phone = fullTimeline({ phone: true, files: 4 });
    expect(phone.budget).toBe(Math.round(INTRO_BUDGET_MS.full * PHONE_FACTOR));
    expect(phone.deadline + phone.tail).toBeLessThanOrEqual(phone.budget);
    expect(phone.develop).toBe(Math.round(desk.develop * PHONE_FACTOR));
    // the stagger stays at 40 ms
    expect(phone.stagger).toBe(40);
  });

  it("orders the steps: flash → develop → eyes open → files → capsule and dock", () => {
    const t = fullTimeline({ phone: false, files: 4 });
    expect(t.developAt).toBeLessThan(t.flash);
    expect(t.openAt).toBeGreaterThanOrEqual(t.developAt + t.develop - 50);
    expect(t.dropAt).toBeGreaterThan(t.openAt);
    expect(t.lateAt).toBeGreaterThan(t.dropAt);
    expect(t.develop).toBeGreaterThanOrEqual(700);
    expect(t.develop).toBeLessThanOrEqual(900);
  });
});

describe("fitTail", () => {
  it("keeps the steps when ready on time", () => {
    const t = fullTimeline({ phone: false, files: 4 });
    expect(fitTail(t, t.deadline)).toBe(t);
  });

  it("squeezes the steps when ready late, so the intro still ends within 2.8 s", () => {
    const t = fullTimeline({ phone: false, files: 4 });
    const readyAt = t.deadline + 400;
    const f = fitTail(t, readyAt);
    expect(readyAt + f.tail).toBeLessThanOrEqual(t.budget + 5);
    expect(f.develop).toBeLessThan(t.develop);
    expect(f.stagger).toBe(t.stagger);
  });

  it("never squeezes below the floor", () => {
    const t = fullTimeline({ phone: true, files: 4 });
    const f = fitTail(t, t.budget);
    expect(f.develop).toBe(Math.round(t.develop * MIN_TAIL_FACTOR));
  });
});

describe("shortTimeline", () => {
  it("stays within 0.6 s (phones 30 % less)", () => {
    expect(shortTimeline({ phone: false }).total).toBeLessThanOrEqual(INTRO_BUDGET_MS.short);
    expect(shortTimeline({ phone: true }).total).toBeLessThanOrEqual(INTRO_BUDGET_MS.short * PHONE_FACTOR);
  });
});

describe("loadProgress", () => {
  it("counts real assets only", () => {
    expect(loadProgress({ poster: false, fonts: false, textures: { loaded: 0, total: 10 } })).toBe(0);
    expect(loadProgress({ poster: true, fonts: true, textures: { loaded: 4, total: 10 } })).toBe(0.5);
    expect(loadProgress({ poster: true, fonts: true, textures: null })).toBe(1);
    expect(loadProgress({ poster: true, fonts: false, textures: null })).toBe(0.5);
    expect(loadProgress({ poster: true, fonts: true, icons: { loaded: 1, total: 4 }, textures: { loaded: 3, total: 10 } })).toBe(0.375);
  });
});

const base: ModeInput = { param: null, bot: false, reducedMotion: false, seen: false, windowPath: false };

describe("chooseIntro", () => {
  it("picks the variant", () => {
    expect(chooseIntro(base)).toBe("full");
    expect(chooseIntro({ ...base, seen: true })).toBe("repeat");
    expect(chooseIntro({ ...base, windowPath: true })).toBe("window");
    expect(chooseIntro({ ...base, reducedMotion: true })).toBe("fade");
    expect(chooseIntro({ ...base, bot: true })).toBe("none");
  });

  it("lets ?intro= force a variant, also for automation", () => {
    expect(chooseIntro({ ...base, bot: true, param: "full" })).toBe("full");
    expect(chooseIntro({ ...base, bot: true, param: "auto", seen: true })).toBe("repeat");
    expect(chooseIntro({ ...base, param: "nonsense" })).toBe("full");
  });

  it("recognises bots and Lighthouse", () => {
    expect(isBotAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isBotAgent("Mozilla/5.0 (Linux; Android 11) Chrome/120 Mobile Safari/537.36 Chrome-Lighthouse")).toBe(true);
    expect(isBotAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154.0 Safari/537.36")).toBe(false);
  });
});

/** Runs the inline head script against a fake browser and returns data-intro. */
function runScript(env: {
  connection?: { saveData?: boolean; effectiveType?: string };
  search?: string;
  path?: string;
  ua?: string;
  webdriver?: boolean;
  reduced?: boolean;
  phone?: boolean;
  seen?: boolean;
  storageThrows?: boolean;
}) {
  const attrs: Record<string, string> = {};
  const document = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
  const location = { search: env.search ?? "", pathname: env.path ?? "/pl" };
  const navigator = { webdriver: env.webdriver ?? false, userAgent: env.ua ?? "Mozilla/5.0 Chrome/154.0", connection: env.connection };
  const sessionStorage = {
    getItem: (k: string) => {
      if (env.storageThrows) throw new Error("denied");
      return env.seen && k === INTRO_SEEN_KEY ? "1" : null;
    },
  };
  const matchMedia = (q: string) => ({ matches: q.includes("reduce") ? (env.reduced ?? false) : (env.phone ?? false) });
  const fetched: string[] = [];
  const fetch = (url: string) => (fetched.push(url), Promise.resolve());
  const listeners = new Map<string, () => void>();
  const addEventListener = (type: string, fn: () => void) => listeners.set(type, fn);
  const removeEventListener = (type: string) => listeners.delete(type);
  new Function(
    "document",
    "location",
    "navigator",
    "sessionStorage",
    "matchMedia",
    "fetch",
    "addEventListener",
    "removeEventListener",
    introScript(),
  )(document, location, navigator, sessionStorage, matchMedia, fetch, addEventListener, removeEventListener);
  last = { fetched, listeners, attrs };
  return attrs["data-intro"];
}
let last: { fetched: string[]; listeners: Map<string, () => void>; attrs: Record<string, string> } = {
  fetched: [],
  listeners: new Map(),
  attrs: {},
};

describe("introScript", () => {
  it("agrees with chooseIntro", () => {
    expect(runScript({})).toBe("full");
    expect(runScript({ path: "/en/" })).toBe("full");
    expect(runScript({ seen: true })).toBe("repeat");
    expect(runScript({ path: "/pl/oferta" })).toBe("window");
    expect(runScript({ path: "/en/projects/obok" })).toBe("window");
    expect(runScript({ reduced: true })).toBe("fade");
    expect(runScript({ webdriver: true })).toBe("none");
    expect(runScript({ ua: "Chrome-Lighthouse" })).toBe("none");
    expect(runScript({ webdriver: true, search: "?intro=full" })).toBe("full");
    expect(runScript({ webdriver: true, search: "?intro=auto", seen: true })).toBe("repeat");
  });

  it("starts downloading the character's textures only for the full intro", () => {
    runScript({});
    // the layers; the intro's base is the poster
    expect(last.fetched).toEqual(CHARACTER_LAYERS.map((f) => `/character/${f}`));
    runScript({ seen: true });
    expect(last.fetched).toHaveLength(0);
    runScript({ webdriver: true });
    expect(last.fetched).toHaveLength(0);
    // slow or metered connections: the page first
    runScript({ connection: { effectiveType: "3g" } });
    expect(last.fetched).toHaveLength(0);
    runScript({ connection: { effectiveType: "4g", saveData: true } });
    expect(last.fetched).toHaveLength(0);
    runScript({ connection: { effectiveType: "4g" } });
    expect(last.fetched).toHaveLength(CHARACTER_LAYERS.length);
  });

  it("remembers a click before hydration (the director skips at once)", () => {
    runScript({});
    expect([...last.listeners.keys()].sort()).toEqual([...SKIP_EVENTS].sort());
    last.listeners.get("pointerdown")!();
    expect(last.attrs["data-intro-skip"]).toBe("");
    expect(last.listeners.size).toBe(0);
    runScript({ webdriver: true });
    expect(last.listeners.size).toBe(0);
  });

  it("survives blocked storage (first visit)", () => {
    expect(runScript({ storageThrows: true })).toBe("full");
  });
});
