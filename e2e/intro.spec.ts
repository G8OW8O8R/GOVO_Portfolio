import { expect, test, type Page } from "@playwright/test";

const html = (page: Page) => page.locator("html");
const overlay = (page: Page) => page.locator("[data-intro-overlay]");
/** The left owl eye's shift in logo viewBox units (null mid-blink: the translate then carries the squash). */
const eye = (page: Page) =>
  page.evaluate(() => {
    const t = document.querySelector("#govo-eye-L")?.getAttribute("transform") ?? "";
    const m = /^translate\(([-\d.]+) ([-\d.]+)\)$/.exec(t);
    return m ? { x: Number(m[1]), y: Number(m[2]) } : null;
  });

test.describe("intro and the living logo", () => {
  test("bots and automation get the page without the overlay", async ({ page }) => {
    await page.goto("/pl");
    await expect(html(page)).toHaveAttribute("data-intro", "none");
    await expect(overlay(page)).toBeHidden();
    await expect(page.locator('[data-intro-drop=""]').first()).toHaveCSS("opacity", "1");
  });

  test("first visit plays, a click skips it, the next visit is short", async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 });
    // ?intro=auto: the visitor's logic without the automation check
    await page.goto("/pl?intro=auto");
    await expect(html(page)).toHaveAttribute("data-intro", "full");
    await expect(overlay(page)).toBeVisible();
    // invisible (but painted) until their drop
    await expect(page.locator('[data-intro-drop=""]').first()).toHaveCSS("opacity", "0.001");

    await page.mouse.click(700, 400);
    await expect(html(page)).toHaveAttribute("data-intro-done", "", { timeout: 1500 });
    await expect(overlay(page)).toBeHidden();
    await expect(page.locator('[data-intro-drop=""]').first()).toHaveCSS("opacity", "1");
    expect(await page.evaluate(() => sessionStorage.getItem("govo:intro"))).toBe("1");

    await page.goto("/en?intro=auto");
    await expect(html(page)).toHaveAttribute("data-intro", "repeat");
    await expect(html(page)).toHaveAttribute("data-intro-done", "", { timeout: 1500 });
  });

  test("a window address: short version and the window at once; reduced motion: no intro", async ({ page }) => {
    await page.goto("/pl/oferta?intro=auto");
    await expect(html(page)).toHaveAttribute("data-intro", "window");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(html(page)).toHaveAttribute("data-intro-done", "", { timeout: 1500 });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/pl?intro=auto");
    await expect(html(page)).toHaveAttribute("data-intro", "fade");
    await expect(overlay(page)).toBeHidden();
  });

  test("the logo's owl eyes open with the character and follow the cursor", async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 });
    await page.goto("/pl?intro=auto");
    await expect(page.locator("canvas[data-live]")).toHaveCount(1, { timeout: 20_000 });
    await expect(html(page)).toHaveAttribute("data-intro-done", "", { timeout: 6000 });
    // the logo sits top left: the cursor far right, then far below it
    await page.mouse.move(1500, 40, { steps: 4 });
    await expect.poll(async () => (await eye(page))?.x ?? 0, { timeout: 3000 }).toBeGreaterThan(2);
    await page.mouse.move(110, 840, { steps: 4 });
    await expect.poll(async () => (await eye(page))?.y ?? 0, { timeout: 3000 }).toBeGreaterThan(2);
    // never more than ±4 viewBox units (away from the logo hover)
    await expect
      .poll(async () => {
        const e = await eye(page);
        return e ? Math.max(Math.abs(e.x), Math.abs(e.y)) : 0;
      })
      .toBeLessThanOrEqual(4);
  });
});
