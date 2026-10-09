import { expect, test, type Request } from "@playwright/test";

const WINDOWS = ["/pl/o-mnie", "/pl/oferta", "/pl/kontakt", "/pl/cv", "/pl/projekty/obok"];
/** Router requests for a window's content (React Server Components payload). */
const windowRsc = (r: Request) => {
  const url = new URL(r.url());
  return url.searchParams.has("_rsc") && WINDOWS.includes(url.pathname) ? url.pathname : null;
};

test.describe("loading windows ahead", () => {
  test.use({ viewport: { width: 1536, height: 864 } });

  test("the start loads no window; hover loads one, and opening it needs no more code", async ({ page }) => {
    // a slow connection: nothing is loaded ahead after the intro, only on intent
    await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { effectiveType: "3g", saveData: false } }));
    const requests: Request[] = [];
    page.on("request", (r) => requests.push(r));
    await page.goto("/pl");
    const files = page.getByRole("navigation", { name: "Pliki na pulpicie" });
    const about = files.getByRole("link", { name: /O mnie/ });
    await expect(about).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(requests.map(windowRsc).filter(Boolean)).toEqual([]);

    const content = page.waitForRequest((r) => windowRsc(r) === "/pl/o-mnie");
    await about.hover();
    await (await content).response();
    await page.waitForTimeout(800); // nothing else follows
    expect(new Set(requests.map(windowRsc).filter(Boolean))).toEqual(new Set(["/pl/o-mnie"]));

    // the window's code came with the desktop: no script after the click carries it
    const before = requests.length;
    await about.click();
    await expect(page.getByRole("dialog", { name: "O mnie" })).toBeVisible();
    await page.waitForTimeout(800);
    const scripts = requests.slice(before).filter((r) => r.resourceType() === "script");
    const bodies = await Promise.all(scripts.map(async (r) => (await r.response())?.text() ?? ""));
    expect(bodies.filter((b) => b.includes("data-app-window"))).toEqual([]);
  });
});

test.describe("service pages ahead", () => {
  test.use({ viewport: { width: 1536, height: 864 } });
  const serviceRsc = (r: Request) => {
    const url = new URL(r.url());
    return url.searchParams.has("_rsc") && url.pathname.startsWith("/pl/uslugi/") ? url.pathname : null;
  };

  test("load only once the Offer is open, not with the desktop", async ({ page }) => {
    const requests: Request[] = [];
    page.on("request", (r) => requests.push(r));
    await page.goto("/pl");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3500); // the desktop's own load-ahead has run
    expect(requests.map(serviceRsc).filter(Boolean)).toEqual([]);

    await page.getByRole("navigation", { name: "Pliki na pulpicie" }).getByRole("link", { name: /Oferta/ }).click();
    await expect(page.getByRole("dialog", { name: "Oferta" })).toBeVisible();
    await expect.poll(() => new Set(requests.map(serviceRsc).filter(Boolean)).size, { timeout: 8000 }).toBe(5);
  });
});
