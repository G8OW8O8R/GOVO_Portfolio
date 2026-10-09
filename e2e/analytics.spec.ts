import { expect, test, type BrowserContext, type Page } from "@playwright/test";

/**
 * Visit statistics against the production build started with ANALYTICS_E2E=1
 * (playwright.config.ts). Umami's tracker is replaced by a stub that records
 * what it is asked to send; nothing ever reaches Umami. The page sees an
 * ordinary browser (no navigator.webdriver, a desktop Chrome user agent) – a
 * test that wants the automated one opens a plain context.
 */

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const SCRIPT = "/s/script.js";

type Hit = { url: string; title?: string; referrer?: string; name?: string; data?: Record<string, string> };

const STUB = `window.__hits=[];window.umami={track:function(b){window.__hits.push(typeof b==="function"?b({website:"stub"}):b)}};`;

const onDev = () => test.info().project.name === "dev";

/** Stub tracker, Umami unreachable, external links answered empty; returns how often the tracker was requested. */
async function stub(context: BrowserContext) {
  const loads = { count: 0 };
  await context.route(`**${SCRIPT}`, (route) => {
    loads.count++;
    return route.fulfill({ contentType: "text/javascript", body: STUB });
  });
  await context.route("**/s/api/send", () => {
    throw new Error("the stub never sends");
  });
  await context.route(/^https?:\/\/(?!localhost)/, (route) => route.fulfill({ body: "" }));
  return loads;
}

/** A person's browser: not automated, intro already seen in this session (the short one). */
async function person(context: BrowserContext) {
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false });
    sessionStorage.setItem("govo:intro", "1");
  });
}

const hits = (page: Page) => page.evaluate(() => (window as unknown as { __hits?: Hit[] }).__hits ?? []);
const views = async (page: Page) => (await hits(page)).filter((h) => !h.name).map((h) => new URL(h.url).pathname);
const events = async (page: Page) => (await hits(page)).filter((h) => h.name).map(({ name, data }) => ({ name, data }));

/** A key press is an interaction: the tracker loads right after it, in an idle moment. */
async function interact(page: Page) {
  await page.keyboard.press("Shift");
}

test.describe("statistics (production build)", () => {
  test.use({ viewport: { width: 1536, height: 864 }, userAgent: CHROME });
  test.beforeEach(() => test.skip(onDev(), "production build only"));

  test("page views of windows opened in place, desktop events, no personal data", async ({ page, context }) => {
    const loads = await stub(context);
    await person(context);
    await page.setExtraHTTPHeaders({ "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 250) + 1}` });
    await page.goto("/pl");

    // late: after an idle moment even without any interaction
    await expect.poll(() => views(page), { timeout: 10_000 }).toEqual(["/pl"]);
    expect(loads.count).toBe(1);
    const tag = page.locator(`script[src="${SCRIPT}"]`);
    await expect(tag).toHaveAttribute("data-host-url", "/s");
    await expect(tag).toHaveAttribute("data-domains", "www.govodigital.com");
    await expect(tag).toHaveAttribute("data-auto-track", "false");
    await expect(tag).toHaveAttribute("data-website-id", /.+/);

    // a small preview that stays counts once; the quick look (Space) always
    const files = page.getByRole("navigation", { name: "Pliki na pulpicie" });
    const obok = files.getByRole("link", { name: /Obok/ });
    await obok.hover();
    await page.waitForTimeout(1700);
    await page.mouse.move(5, 5);
    await obok.hover();
    await page.waitForTimeout(1700);
    await obok.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("Escape");
    expect(await events(page)).toEqual([
      { name: "quicklook", data: { file: "project-obok" } },
      { name: "quicklook", data: { file: "project-obok" } },
    ]);

    // a window opened in place: its own page view and window-open; the live link
    await obok.click();
    await expect(page.getByRole("dialog", { name: "Obok" })).toBeVisible();
    const popup = page.waitForEvent("popup");
    await page.getByRole("link", { name: /Otwórz Obok/ }).click();
    await (await popup).close();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/pl$/);

    // "Work with me" → Contact → a message sent (the provider call is skipped in this build)
    await page.getByRole("link", { name: /Współpracujmy/ }).click();
    await page.getByLabel("Imię").fill("Anna Nowak");
    await page.getByLabel("E-mail", { exact: true }).fill("anna@example.com");
    await page.getByRole("radio", { name: "Strona dla firmy" }).check();
    await page.getByRole("radio", { name: "1–3 tys." }).check();
    await page.getByLabel("Wiadomość").fill("Potrzebuję strony dla gabinetu.");
    await page.getByRole("button", { name: "Wyślij wiadomość" }).click();
    await expect(page.getByText("Dzięki! Odpiszę zwykle w ciągu doby.")).toBeVisible();
    await page.keyboard.press("Escape");

    // CV: download
    await files.getByRole("link", { name: "CV.pdf" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Pobierz PDF" }).click();
    await download;

    await expect.poll(() => events(page)).toContainEqual({ name: "cv-download", data: { lang: "pl" } });
    expect(await views(page)).toEqual(["/pl", "/pl/projekty/obok", "/pl", "/pl/kontakt", "/pl", "/pl/cv"]);
    expect((await events(page)).slice(2)).toEqual([
      { name: "window-open", data: { window: "project-obok" } },
      { name: "obok-open-live", data: undefined },
      { name: "cta-cooperate", data: undefined },
      { name: "window-open", data: { window: "contact" } },
      { name: "contact-sent", data: { topic: "strona", budget: "1-3-tys" } },
      { name: "window-open", data: { window: "cv" } },
      { name: "cv-download", data: { lang: "pl" } },
    ]);
    // the referrer of a window opened in place is the address it was opened from
    expect((await hits(page)).find((h) => h.url.endsWith("/pl/projekty/obok"))?.referrer).toBe("/pl");
    // nothing a visitor typed
    const sent = JSON.stringify(await hits(page));
    for (const typed of ["Anna", "anna@example.com", "gabinetu"]) expect(sent).not.toContain(typed);
  });

  test("English pages; a service page entered directly is a view, not a window opening", async ({ page, context }) => {
    await stub(context);
    await person(context);
    await page.goto("/en/services/landing-pages");
    await interact(page);
    await expect.poll(() => views(page)).toEqual(["/en/services/landing-pages"]);
    expect(await events(page)).toEqual([{ name: "service-view", data: { service: "landing-page" } }]);
  });

  test("the privacy note under the contact form opens the Privacy window", async ({ page, context }) => {
    await stub(context);
    await person(context);
    await page.goto("/pl/kontakt");
    await page.getByRole("link", { name: "Prywatność →" }).click();
    await expect(page).toHaveURL(/\/pl\/prywatnosc$/);
    const dialog = page.getByRole("dialog", { name: "Prywatność" });
    await expect(dialog.getByText("Prezesa Urzędu Ochrony Danych Osobowych", { exact: false })).toBeVisible();
    await expect.poll(() => events(page)).toContainEqual({ name: "window-open", data: { window: "privacy" } });
  });

  test("an automated browser never loads the tracker", async ({ page, context }) => {
    const loads = await stub(context);
    await page.goto("/pl");
    await interact(page);
    await page.waitForTimeout(4000);
    expect(loads.count).toBe(0);
    await expect(page.locator(`script[src="${SCRIPT}"]`)).toHaveCount(0);
  });

  test("?nie-licz-mnie turns counting off for good, ?licz-mnie back on", async ({ page, context }) => {
    const loads = await stub(context);
    await person(context);

    await page.goto("/pl?nie-licz-mnie");
    await expect(page.getByText("Ta przeglądarka nie jest liczona w statystykach")).toBeVisible();
    await expect(page).toHaveURL(/\/pl$/);
    expect(await page.evaluate(() => localStorage.getItem("umami.disabled"))).toBe("1");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.govodigital.com/pl");
    await interact(page);
    await page.waitForTimeout(4000);
    await expect(page.getByText("Ta przeglądarka nie jest liczona w statystykach")).toBeHidden();

    await page.reload();
    await interact(page);
    await page.waitForTimeout(2000);
    expect(loads.count).toBe(0);

    // English, other parameters kept
    await page.goto("/en/contact?temat=strona&licz-mnie");
    await expect(page.getByText("Counting is on")).toBeVisible();
    await expect(page).toHaveURL(/\/en\/contact\?temat=strona$/);
    expect(await page.evaluate(() => localStorage.getItem("umami.disabled"))).toBeNull();
    await interact(page);
    await expect.poll(() => views(page)).toEqual(["/en/contact"]);
    expect(loads.count).toBe(1);
  });
});

test("dev server: no statistics", async ({ page, context }) => {
  test.skip(!onDev(), "dev server only");
  const loads = await stub(context);
  await person(context);
  await page.goto("/pl");
  await interact(page);
  await page.waitForTimeout(4000);
  expect(loads.count).toBe(0);
  await expect(page.locator(`script[src="${SCRIPT}"]`)).toHaveCount(0);
});
