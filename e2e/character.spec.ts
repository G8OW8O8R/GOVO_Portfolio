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
    };
  }
}

const live = (page: Page) => page.locator("canvas[data-live]");

test.describe("living character", () => {
  test("rest frame equals base.jpg, eyes stay in their masks, smooth at CPU 4×", async ({ page, context }) => {
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

    // real-time loop at CPU 4×: median frame within a 60 Hz budget
    await page.evaluate(() => (window.__character.setTarget(null), window.__character.manual(false)));
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
