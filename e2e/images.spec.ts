import { expect, test, type Request } from "@playwright/test";

const isPicture = (url: string) => /\/img\/.+\.[0-9a-f]{8}\.\d+\.(avif|webp)$/.test(new URL(url).pathname);
/** The originals and the image optimiser are never on the way to a window picture. */
const isSourceOrOptimiser = (url: string) =>
  /\/_next\/image\?url=%2F(skills|services|icons|projects)/.test(url) ||
  /^\/(skills|services|icons)\/[^/]+\.png$|^\/projects\/obok\/(shots|scenes)\/|preview-poster\.jpg/.test(new URL(url).pathname);

test.describe("window pictures", () => {
  test.use({ viewport: { width: 1536, height: 864 } });

  test("load on hover as static AVIF, cached for good, and fade in over a placeholder", async ({ page }) => {
    const requests: Request[] = [];
    page.on("request", (r) => requests.push(r));
    await page.goto("/pl");
    const file = page.getByRole("navigation", { name: "Pliki na pulpicie" }).getByRole("link", { name: /O mnie/ });
    await expect(file).toBeVisible();

    // hovering the file starts its window's pictures
    const thumb = page.waitForRequest((r) => /\/img\/skills\/.+\.avif$/.test(r.url()));
    await file.hover();
    const first = await thumb;
    const response = await first.response();
    expect(response?.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
    expect(response?.headers()["content-type"]).toBe("image/avif");

    await file.click();
    await page.getByRole("tab", { name: "Umiejętności" }).click();
    const panel = page.getByRole("tabpanel", { name: "Umiejętności" });
    const pictures = panel.locator("img[data-fade]");
    await expect(pictures.first()).toHaveAttribute("data-ready", "");
    await expect(pictures.first()).toHaveCSS("opacity", "1");
    // the frame holds the blurred preview until then
    expect(await panel.locator("picture").first().evaluate((p) => getComputedStyle(p).backgroundImage)).toMatch(/^url\("data:image\/webp/);

    // the Offer window: its services, no hidden-tab video poster
    await page.keyboard.press("Escape");
    await page.getByRole("navigation", { name: "Pliki na pulpicie" }).getByRole("link", { name: /Oferta/ }).click();
    await expect(page.getByRole("dialog", { name: "Oferta" }).locator("img[data-ready]").first()).toBeVisible();

    const urls = requests.map((r) => r.url());
    expect(urls.filter(isPicture).length).toBeGreaterThan(4);
    expect(urls.filter(isSourceOrOptimiser)).toEqual([]);
  });

  test("show without JS", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1536, height: 864 } });
    const page = await context.newPage();
    await page.goto("/pl/o-mnie#umiejetnosci");
    const picture = page.locator("#umiejetnosci img[data-fade]").first();
    await expect(picture).toHaveJSProperty("complete", true);
    await expect(picture).toHaveCSS("opacity", "1");
    await context.close();
  });
});
