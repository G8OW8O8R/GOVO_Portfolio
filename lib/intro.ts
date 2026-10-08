import { CHARACTER_LAYERS } from "./character/stage";

/**
 * Intro "Przebudzenie": which variant plays and when
 * each step happens. Pure – the overlay (components/intro) only executes it.
 *
 *   full   – first visit in the session: logo drawn while the assets really
 *            load → pendant flash → the character develops with closed eyes →
 *            character and logo open their eyes at the visitor → files drop in
 *   repeat – later visits in the session: flash and fade only
 *   window – a window address opened directly: the short version, window at once
 *   fade   – reduced motion: no intro, a plain fade of the page
 *   none   – bots and automation: nothing on top of the page
 */

export type IntroMode = "full" | "repeat" | "window" | "fade" | "none";
export const INTRO_MODES: readonly IntroMode[] = ["full", "repeat", "window", "fade", "none"];

/** sessionStorage key: "the intro was seen" – the only thing the intro stores. */
export const INTRO_SEEN_KEY = "govo:intro";
/** `?intro=full|repeat|window|fade|none` forces a variant (measuring, recordings); `auto` ignores the bot check. */
export const INTRO_PARAM = "intro";

/** The flash starts on the OVO pendant's diamonds (image px, the medallion's centre – same box as the Pendant button). */
export const FLASH_FROM = [1390, 902] as const;

export const INTRO_BUDGET_MS = { full: 2800, short: 600 } as const;
/** Phones play everything 30 % shorter. */
export const PHONE_FACTOR = 0.7;

/**
 * Full intro on desktop, ms. Loading ends at `ready` (all assets in, the logo
 * drawn, or the deadline); everything after is relative to `ready`.
 */
/**
 * How far the steps after `ready` may be squeezed so the living character
 * still makes it (it develops a little faster); later than that the intro
 * goes on with the poster.
 */
export const LATE_TAIL_FACTOR = 0.8;

export const FULL_STEPS = {
  /** logo outline drawing, from the first paint */
  draw: 900,
  /** pendant flash spreading over the screen */
  flash: 420,
  /** development starts while the flash peaks, lasts ~0.8 s */
  developAt: 150,
  develop: 800,
  /** eyes open together (blink opening), look at the visitor for a moment */
  openAt: 950,
  look: 550,
  /** files drop in one after another with a slight bounce */
  dropAt: 1050,
  drop: 420,
  /** stagger between files – kept at 40 ms on phones too */
  stagger: 40,
  /** "Work with me" capsule and the dock last */
  lateAt: 1400,
  late: 380,
} as const;

/** Short intro (repeat visits, window addresses), ms: a flash and the overlay fading. */
export const SHORT_STEPS = { flash: 300, fadeAt: 120, fade: 380 } as const;

export type FullTimeline = {
  /** files that drop in */
  files: number;
  draw: number;
  /** latest `ready` (ms from navigation start) that fits the budget unsqueezed */
  deadline: number;
  /** how long to wait for the living character (ms from navigation start): the tail then runs at LATE_TAIL_FACTOR */
  wait: number;
  flash: number;
  developAt: number;
  develop: number;
  openAt: number;
  look: number;
  dropAt: number;
  drop: number;
  stagger: number;
  lateAt: number;
  late: number;
  /** from `ready` to the last thing settling */
  tail: number;
  budget: number;
};

export function fullTimeline({ phone, files }: { phone: boolean; files: number }): FullTimeline {
  const k = phone ? PHONE_FACTOR : 1;
  const s = (ms: number) => Math.round(ms * k);
  const budget = s(INTRO_BUDGET_MS.full);
  const t = {
    flash: s(FULL_STEPS.flash),
    developAt: s(FULL_STEPS.developAt),
    develop: s(FULL_STEPS.develop),
    openAt: s(FULL_STEPS.openAt),
    look: s(FULL_STEPS.look),
    dropAt: s(FULL_STEPS.dropAt),
    drop: s(FULL_STEPS.drop),
    stagger: FULL_STEPS.stagger,
    lateAt: s(FULL_STEPS.lateAt),
    late: s(FULL_STEPS.late),
  };
  const filesEnd = t.dropAt + Math.max(0, files - 1) * t.stagger + t.drop;
  const tail = Math.max(filesEnd, t.lateAt + t.late, t.openAt + t.look, t.developAt + t.develop);
  // more projects on the desktop → a longer drop → less time to wait for the assets
  const deadline = budget - tail;
  const wait = budget - Math.round(tail * LATE_TAIL_FACTOR);
  return { ...t, files, draw: Math.min(s(FULL_STEPS.draw), deadline), deadline, wait, tail, budget };
}

/** The tail can be squeezed this far when the page became ready late (slow hydration). */
export const MIN_TAIL_FACTOR = 0.6;

/**
 * Steps after `ready` that still fit the budget when `ready` came at `readyAt`
 * (ms from navigation start): on time → unchanged; late → everything after
 * `ready` runs proportionally faster, down to MIN_TAIL_FACTOR (the stagger stays).
 */
export function fitTail(t: FullTimeline, readyAt: number): FullTimeline {
  const left = t.budget - readyAt;
  if (left >= t.tail) return t;
  const k = Math.max(MIN_TAIL_FACTOR, left / t.tail);
  const s = (ms: number) => Math.round(ms * k);
  const fitted = {
    ...t,
    flash: s(t.flash),
    developAt: s(t.developAt),
    develop: s(t.develop),
    openAt: s(t.openAt),
    look: s(t.look),
    dropAt: s(t.dropAt),
    drop: s(t.drop),
    lateAt: s(t.lateAt),
    late: s(t.late),
  };
  const filesEnd = fitted.dropAt + Math.max(0, t.files - 1) * t.stagger + fitted.drop;
  return { ...fitted, tail: Math.max(filesEnd, fitted.lateAt + fitted.late, fitted.openAt + fitted.look, fitted.developAt + fitted.develop) };
}

export type ShortTimeline = { flash: number; fadeAt: number; fade: number; total: number };

export function shortTimeline({ phone }: { phone: boolean }): ShortTimeline {
  const k = phone ? PHONE_FACTOR : 1;
  const flash = Math.round(SHORT_STEPS.flash * k);
  const fadeAt = Math.round(SHORT_STEPS.fadeAt * k);
  const fade = Math.round(SHORT_STEPS.fade * k);
  return { flash, fadeAt, fade, total: Math.max(flash, fadeAt + fade) };
}

/**
 * Progress of the real loading 0..1: poster, fonts, the file icons (decoded,
 * so they don't decode in the middle of their drop) and the character's
 * textures (when the living character loads at all). No fake percentages.
 */
export function loadProgress({
  poster,
  fonts,
  icons = { loaded: 0, total: 0 },
  textures,
}: {
  poster: boolean;
  fonts: boolean;
  icons?: { loaded: number; total: number };
  textures: { loaded: number; total: number } | null;
}): number {
  const parts = 2 + icons.total + (textures?.total ?? 0);
  const done =
    Number(poster) + Number(fonts) + Math.min(icons.loaded, icons.total) + (textures ? Math.min(textures.loaded, textures.total) : 0);
  return done / parts;
}

/**
 * Ways a visitor says "let me in": each one skips the rest of the intro.
 * Scrolling comes as wheel / touch / keys; a bare "scroll" event is left out,
 * the browser fires it itself (scroll restoration).
 */
export const SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
const SKIP_EVENTS_JS = JSON.stringify(SKIP_EVENTS);

const BOT = /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|embedly|quora|whatsapp|telegram/i;

export type ModeInput = {
  param: string | null;
  bot: boolean;
  reducedMotion: boolean;
  seen: boolean;
  /** the address opens a window (not the bare desktop) */
  windowPath: boolean;
};

/** Which variant plays. Mirrored by the inline head script (introScript). */
export function chooseIntro({ param, bot, reducedMotion, seen, windowPath }: ModeInput): IntroMode {
  if (param && (INTRO_MODES as readonly string[]).includes(param)) return param as IntroMode;
  if (bot && param !== "auto") return "none";
  if (reducedMotion) return "fade";
  if (windowPath) return "window";
  return seen ? "repeat" : "full";
}

export const isBotAgent = (ua: string) => BOT.test(ua);

/**
 * Inline <head> script: decides the variant before the first paint and puts
 * it on <html data-intro>, so the server-rendered overlay shows only for
 * people (bots and Lighthouse get the page as is). Desktop home = /pl, /en.
 */
export function introScript(): string {
  const modes = JSON.stringify(INTRO_MODES);
  // full intro: the character's layers start downloading now, not at hydration (the worker then gets them from the
  // HTTP cache; its base for the intro is the poster) – on fast connections only: on a slow one they wouldn't make
  // it anyway and would slow the page
  const files = JSON.stringify(CHARACTER_LAYERS.map((f) => `/character/${f}`));
  const prefetch = `var c=navigator.connection;if(m==="full"&&typeof fetch=="function"&&!(c&&(c.saveData||(c.effectiveType&&c.effectiveType!=="4g")))){${files}.forEach(function(u){fetch(u,{priority:"low"}).catch(function(){})})}`;
  // a click / key / wheel / touch before hydration is remembered: the director skips at once when it mounts
  const skip = `if(m!=="none"&&m!=="fade"){var k=function(){d.setAttribute("data-intro-skip","");${SKIP_EVENTS_JS}.forEach(function(e){removeEventListener(e,k,!0)})};${SKIP_EVENTS_JS}.forEach(function(e){addEventListener(e,k,!0)})}`;
  return `(function(){try{var d=document.documentElement,q=new URLSearchParams(location.search),p=q.get(${JSON.stringify(INTRO_PARAM)}),s=null,m;try{s=sessionStorage.getItem(${JSON.stringify(INTRO_SEEN_KEY)})}catch(e){}var bot=!!navigator.webdriver||${BOT.toString()}.test(navigator.userAgent);if(p&&${modes}.indexOf(p)>=0)m=p;else if(bot&&p!=="auto")m="none";else if(matchMedia("(prefers-reduced-motion: reduce)").matches)m="fade";else if(!/^\\/(pl|en)\\/?$/.test(location.pathname))m="window";else m=s!==null?"repeat":"full";d.setAttribute("data-intro",m);${skip}${prefetch}}catch(e){}})()`;
}

/** The variant chosen by the head script (client only). */
export function currentIntro(): IntroMode {
  if (typeof document === "undefined") return "none";
  const m = document.documentElement.getAttribute("data-intro");
  return (INTRO_MODES as readonly string[]).includes(m ?? "") ? (m as IntroMode) : "none";
}
