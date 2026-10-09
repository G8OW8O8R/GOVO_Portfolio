import { expect, test, type Page } from "@playwright/test";
import { computeCharacterBox } from "../lib/character-box";

declare global {
  interface Window {
    __character: {
      manual(on?: boolean): void;
      reset(): void;
      step(ms?: number, n?: number): void;
      setTarget(g: readonly [number, number] | null): void;
      restCompare(): { maxDiff: number; valuesOver1: number; psnr: number };
      irisContainment(g: readonly [number, number]): { lit: number; outside: number };
      frame(): { eyeBlend: number; iris: [number, number] };
      geometry(): { poster: { left: number; top: number; scale: number } };
      fps(): { frames: number; medianMs: number };
      resetFps(): void;
      running(): boolean;
    };
  }
}

const live = (page: Page) => page.locator("canvas[data-live]");

/**
 * Playwright's WebKit on Windows draws WebGL in software (~10 fps): the
 * watchdog rightly calls it a slow device and keeps the poster, so the living
 * loop can't be checked there (the fallback itself is, in intro.spec.ts).
 */
const SOFTWARE_WEBGL = "WebKit on Windows renders WebGL in software: the watchdog falls back to the poster";
/** Headless Firefox draws ~30 fps here: past the watchdog's window it rightly keeps the poster. */
const SLOW_HEADLESS = "headless Firefox renders at ~30 fps: the watchdog falls back once its window is over";

test.describe("living character", () => {
  test("rest frame equals base.jpg, eyes stay in their masks, smooth at CPU 4×", async ({ page, context, browserName }) => {
    test.skip(browserName === "webkit", SOFTWARE_WEBGL);
    await page.setViewportSize({ width: 1536, height: 864 });
    await page.goto("/pl?character=debug&seed=1");
    await expect(live(page)).toHaveCount(1, { timeout: 30_000 });
    await page.waitForFunction(() => !!window.__character);

    // canvas uses the character-box geometry of the poster
    const box = computeCharacterBox({ width: 1536, height: 864 }, "desktop");
    const geo = await page.evaluate(() => window.__character.geometry());
    expect(Math.abs(geo.poster.left - box.x)).toBeLessThan(0.5);
    expect(geo.poster.scale).toBeCloseTo(box.scale, 4);

    // rest (t = 0, gaze 0) rendered 1:1: identical to base.jpg in the whole frame
    await page.evaluate(() => (window.__character.manual(true), window.__character.reset()));
    const rest = await page.evaluate(() => window.__character.restCompare());
    expect(rest.maxDiff).toBeLessThanOrEqual(1);
    expect(rest.valuesOver1).toBe(0);

    // irises never leave the eye masks, at the extremes of the range
    for (const g of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const) {
      const r = await page.evaluate((g) => window.__character.irisContainment(g), g);
      expect(r.lit, `gaze ${g}`).toBeGreaterThan(500);
      expect(r.outside, `gaze ${g}`).toBe(0);
    }

    // looking away switches to the layered eyes; back at rest the original returns
    await page.evaluate(() => (window.__character.reset(), window.__character.setTarget([1, 0]), window.__character.step(1000 / 60, 60)));
    expect(await page.evaluate(() => window.__character.frame().eyeBlend)).toBe(1);
    await page.evaluate(() => (window.__character.setTarget([0, 0]), window.__character.step(1000 / 60, 240)));
    expect(await page.evaluate(() => window.__character.frame().eyeBlend)).toBe(0);

    // real-time loop at CPU 4×: median frame within a 60 Hz budget (CPU throttling is Chromium's DevTools protocol)
    await page.evaluate(() => (window.__character.setTarget(null), window.__character.manual(false)));
    if (browserName !== "chromium") return;
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.__character.resetFps());
    for (let i = 0; i < 120; i++) await page.mouse.move(768 + Math.sin(i / 10) * 600, 300 + Math.cos(i / 13) * 200);
    await page.waitForTimeout(1000);
    const fps = await page.evaluate(() => window.__character.fps());
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    expect(fps.frames).toBeGreaterThan(60);
    expect(fps.medianMs).toBeLessThan(17.5);
    await expect(live(page)).toHaveCount(1); // the watchdog kept it
  });

  test("reduced motion shows the static poster only", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto("/pl");
    await expect(page.locator("img[data-character-poster]")).toBeVisible();
    await page.waitForTimeout(2000);
    await expect(live(page)).toHaveCount(0);
    await context.close();
  });
});

/**
 * The character keeps living through everything that stops rendering for a
 * while (a past bug: one long gap after Print made the watchdog call the
 * device slow, and sessionStorage kept the poster even after a reload).
 */
test.describe("character stays alive", () => {
  test.use({ viewport: { width: 1536, height: 864 } });
  test.beforeEach(({ browserName }) => test.skip(browserName === "webkit", SOFTWARE_WEBGL));

  /** Eyes follow the mouse: left of the face → iris left, right → iris right; no fallback. */
  async function expectAlive(page: Page) {
    await expect(live(page)).toHaveCount(1);
    expect(await page.evaluate(() => window.__character?.running())).toBe(true);
    await page.mouse.move(80, 120, { steps: 3 });
    await expect.poll(() => page.evaluate(() => window.__character.frame().iris[0])).toBeLessThan(-5);
    await page.mouse.move(1460, 700, { steps: 3 });
    await expect.poll(() => page.evaluate(() => window.__character.frame().iris[0])).toBeGreaterThan(5);
  }

  async function open(page: Page) {
    await page.goto("/pl?character=debug");
    await expect(live(page)).toHaveCount(1, { timeout: 30_000 });
    await page.waitForFunction(() => !!window.__character);
  }

  /** The main thread blocked like in an open print dialog (no frames at all). */
  const block = (page: Page, ms: number) =>
    page.evaluate((ms) => {
      const t = performance.now();
      while (performance.now() - t < ms);
    }, ms);

  test("(a) fresh visit: the eyes follow the mouse", async ({ page }) => {
    await open(page);
    await expectAlive(page);
  });

  test("(b) beforeprint / afterprint: paused while printing, alive after", async ({ page, browserName }) => {
    test.skip(browserName === "firefox", SLOW_HEADLESS);
    await open(page);
    await page.evaluate(() => dispatchEvent(new Event("beforeprint")));
    expect(await page.evaluate(() => window.__character.running())).toBe(false);
    await block(page, 3000);
    await page.evaluate(() => dispatchEvent(new Event("afterprint")));
    // a long gap without the print events (e.g. a frozen tab) must not count as slow either
    await page.waitForTimeout(1500);
    await block(page, 3000);
    await page.waitForTimeout(4500); // past the watchdog's warm-up and measuring window
    await expectAlive(page);
    // the old flag is gone and nothing new is stored
    expect(await page.evaluate(() => sessionStorage.getItem("character:fallback"))).toBeNull();
  });

  test("(c) tab hidden for 5 s and back: the loop resumes", async ({ page, browserName }) => {
    test.skip(browserName === "firefox", SLOW_HEADLESS);
    await open(page);
    const setHidden = (hidden: boolean) =>
      page.evaluate((hidden) => {
        if (hidden) {
          Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
          Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
        } else {
          // back to the real getters on Document.prototype
          delete (document as { hidden?: boolean }).hidden;
          delete (document as { visibilityState?: string }).visibilityState;
        }
        document.dispatchEvent(new Event("visibilitychange"));
      }, hidden);
    await setHidden(true);
    expect(await page.evaluate(() => window.__character.running())).toBe(false);
    await page.waitForTimeout(5000);
    await setHidden(false);
    await page.waitForTimeout(4500);
    await expectAlive(page);
  });

  test("(d) the Skills tab with its WebGL demo doesn't take the character's context", async ({ page, browserName }) => {
    test.skip(browserName === "firefox", SLOW_HEADLESS);
    await open(page);
    await page.locator('[data-file-key="about"] a').click();
    const dialog = page.getByRole("dialog", { name: "O mnie" });
    await dialog.getByRole("tab", { name: "Umiejętności" }).click();
    const row = dialog.locator('li:has(img[src*="grafika-realtime"])');
    await row.scrollIntoViewIfNeeded();
    const rb = (await row.boundingBox())!;
    await page.mouse.move(rb.x + 40, rb.y + rb.height / 2, { steps: 4 });
    await expect(row.locator("canvas")).toHaveCount(1);
    await page.waitForTimeout(1500);
    await page.mouse.move(rb.x + 40, rb.y - 200, { steps: 4 });
    await expect(row.locator("canvas")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(
      await page.evaluate(() => document.querySelector<HTMLCanvasElement>("canvas[data-live]")!.getContext("webgl2")!.isContextLost()),
    ).toBe(false);
    await expectAlive(page);
  });
});
