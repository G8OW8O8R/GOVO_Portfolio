import { expect, test } from "@playwright/test";

test.describe("cursor and live skills (desktop mouse)", () => {
  test.use({ viewport: { width: 1536, height: 864 } });

  test("the cursor names the action; a live skill mounts on hover and is freed on leave", async ({ page }) => {
    await page.goto("/pl");
    const cursor = page.locator('[aria-hidden="true"][data-state]');
    const file = page.locator('[data-file-key="about"] a');
    const box = (await file.boundingBox())!;
    // the cursor follows pointer moves seen after hydration: move until it shows
    let nudge = 0;
    await expect
      .poll(async () => {
        await page.mouse.move(box.x + box.width / 2, box.y + 20 + (nudge++ % 2), { steps: 4 });
        return cursor.getAttribute("data-visible");
      })
      .toBe("");
    await expect(cursor).toHaveAttribute("data-state", "open");

    await page.goto("/pl/o-mnie#umiejetnosci");
    const row = page.locator('li:has(img[src*="grafika-realtime"])');
    await row.scrollIntoViewIfNeeded();
    const rb = (await row.boundingBox())!;
    await page.mouse.move(rb.x + 40, rb.y + rb.height / 2, { steps: 4 });
    await expect(row.locator("canvas")).toHaveCount(1);
    await page.mouse.move(rb.x + 40, rb.y - 200, { steps: 4 });
    await expect(row.locator("canvas")).toHaveCount(0);
  });

  test("touch devices keep the plain cursor and thumbnails", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto("/pl/o-mnie#umiejetnosci");
    await expect(page.locator("[data-state][data-visible]")).toHaveCount(0);
    await page.locator('li:has(img[src*="grafika-realtime"])').tap();
    await expect(page.locator("li canvas")).toHaveCount(0);
    await ctx.close();
  });
});
