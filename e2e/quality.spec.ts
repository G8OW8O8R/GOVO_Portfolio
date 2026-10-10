import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility (axe), a clean console and the edge cases, on every page of
 * the sitemap in both languages, in every engine.
 */

const AXE = readFileSync(join(process.cwd(), "node_modules", "axe-core", "axe.min.js"), "utf8");

async function sitemapPaths(page: Page): Promise<string[]> {
  const xml = await (await page.request.get("/sitemap.xml")).text();
  return [...xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]);
}

/** serious and critical axe violations, as "rule: target" lines */
async function axeViolations(page: Page): Promise<string[]> {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (ctx: Document, o: object) => Promise<{ violations: { id: string; impact: string; nodes: { target: string[] }[] }[] }> } }).axe;
    const { violations } = await axe.run(document, { resultTypes: ["violations"] });
    return violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(" ")}`));
  });
}

/** console errors and warnings of the page from now on */
function consoleLog(page: Page): string[] {
  const out: string[] = [];
  page.on("console", (m) => {
    // the test browser's own instrumentation (Firefox: chrome://juggler/…) is not the page
    if (["error", "warning"].includes(m.type()) && !m.text().includes("chrome://")) out.push(`[${m.type()}] ${m.text()}`);
  });
  page.on("pageerror", (e) => out.push(`[pageerror] ${e.message}`));
  return out;
}

for (const viewport of [
  { width: 1536, height: 864 },
  { width: 390, height: 844 },
]) {
  test(`every page at ${viewport.width}×${viewport.height}: no serious or critical axe violations, a clean console`, async ({ browser }) => {
    test.setTimeout(240_000);
    const context = await browser.newContext({ viewport });
    const problems: string[] = [];
    const log: string[] = [];
    for (const path of await sitemapPaths(await context.newPage())) {
      // a tab of its own, closed afterwards: navigating on would abort the page's own
      // late loads (window prefetches, lazy code), which Firefox and WebKit report
      const page = await context.newPage();
      const pageLog = consoleLog(page);
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await page.waitForLoadState("networkidle");
      problems.push(...(await axeViolations(page)).map((v) => `${path} ${v}`));
      log.push(...pageLog.map((l) => `${path} ${l}`));
      await page.close();
    }
    expect(problems).toEqual([]);
    expect(log).toEqual([]);
    await context.close();
  });
}

test("keyboard: the file opens with Enter, the focus ring is the blue accent, Esc gives the focus back", async ({ page, browserName }) => {
  await page.setViewportSize({ width: 1536, height: 864 });
  await page.goto("/pl");
  const file = page.getByRole("navigation", { name: "Pliki na pulpicie" }).getByRole("link", { name: "O mnie" });
  await file.focus();
  // Tab reaches the file (Safari makes links tab stops only with Option+Tab, as its users expect)
  if (browserName !== "webkit") {
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
  }
  await expect(file).toBeFocused();
  expect(await file.evaluate((a) => getComputedStyle(a).outlineColor)).toBe("rgb(111, 143, 224)");
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "O mnie" });
  await expect(dialog).toBeVisible();
  // contrast is checked on the settled window, not on text still fading in: the endless "available"
  // pulse aside, and fades in a hidden tab panel (Firefox doesn't advance them until it shows)
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) =>
          a.playState !== "running" ||
          a.effect?.getTiming().iterations === Infinity ||
          ((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest("[data-inactive]"),
      ),
  );
  expect(await axeViolations(page)).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(file).toBeFocused();
});

test.describe("edge cases", () => {
  for (const [path, lang] of [
    ["/pl/nie-istnieje", "pl"],
    ["/en/does-not-exist", "pl"],
    ["/pl/projekty/nie-ma", "pl"],
    ["/xyz/abc", "pl"],
  ] as const) {
    test(`404 ${path}: the desktop's "no such file" window, both languages, the way back`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.getByRole("heading", { level: 1, name: "Nie ma takiego pliku" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Wróć na pulpit", exact: true })).toHaveAttribute("href", "/pl");
      await expect(page.getByRole("link", { name: /Back to the desktop/ })).toHaveAttribute("href", "/en");
      await expect(page.locator("img[data-character-poster]")).toBeVisible();
      expect(await axeViolations(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    });
  }

  test("a lost WebGL context shows the poster, the character comes back when it is restored", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit on Windows renders WebGL in software: the watchdog falls back to the poster");
    await page.setViewportSize({ width: 1536, height: 864 });
    await page.goto("/pl");
    const live = page.locator("canvas[data-live]");
    await expect(live).toHaveCount(1, { timeout: 20_000 });
    await page.evaluate(() => {
      const gl = document.querySelector("canvas")!.getContext("webgl2")!;
      (window as unknown as { __lose: WEBGL_lose_context }).__lose = gl.getExtension("WEBGL_lose_context")!;
      (window as unknown as { __lose: WEBGL_lose_context }).__lose.loseContext();
    });
    await expect(live).toHaveCount(0);
    await expect(page.locator("img[data-character-poster]")).toBeVisible();
    await page.evaluate(() => (window as unknown as { __lose: WEBGL_lose_context }).__lose.restoreContext());
    await expect(live).toHaveCount(1, { timeout: 10_000 });
  });

  test("the contact form survives a failed request: an error, the message kept, sent on retry", async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 });
    await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 250) + 1}` });
    let fail = true;
    // the server action is a POST to the page with a Next-Action header
    await page.route("**/pl/kontakt*", (route) =>
      route.request().method() === "POST" && route.request().headers()["next-action"] && fail ? route.abort("failed") : route.continue(),
    );
    await page.goto("/pl/kontakt");
    await expect(page.getByText("kontakt@govodigital.com")).toBeVisible();
    const dialog = page.getByRole("dialog", { name: "Kontakt" });
    await page.getByLabel("Imię").fill("Anna Nowak");
    await page.getByLabel("E-mail", { exact: true }).fill("anna@example.com");
    await page.getByRole("radio", { name: "Strona dla firmy" }).check();
    await page.getByLabel("Wiadomość").fill("Potrzebuję strony dla gabinetu.");
    await dialog.getByRole("button", { name: "Wyślij wiadomość" }).click();
    await expect(dialog.getByText("Nie udało się wysłać wiadomości", { exact: false })).toBeVisible();
    await expect(page.getByLabel("Wiadomość")).toHaveValue("Potrzebuję strony dla gabinetu.");
    fail = false;
    await dialog.getByRole("button", { name: /Spróbuj ponownie|Wyślij wiadomość/ }).click();
    await expect(dialog.getByText("Dzięki! Odpiszę zwykle w ciągu doby.")).toBeVisible();
  });

  test("a very slow connection: the intro leaves by itself and never comes back", async ({ page }) => {
    // the page's code (not its CSS) arrives 6 s late: the overlay can't wait for its director
    await page.route("**/_next/static/chunks/**/*.js", async (route) => {
      await new Promise((r) => setTimeout(r, 6000));
      await route.continue();
    });
    await page.goto("/pl?intro=auto", { waitUntil: "commit" });
    await expect(page.locator("html")).toHaveAttribute("data-intro", "full");
    const overlay = page.locator("[data-intro-overlay]");
    await expect(overlay).toBeHidden({ timeout: 4500 });
    // the code arrives: the intro is marked done, the overlay stays away
    await expect(page.locator("html")).toHaveAttribute("data-intro-done", "", { timeout: 20_000 });
    for (let i = 0; i < 10; i++) {
      await expect(overlay).toBeHidden();
      await page.waitForTimeout(200);
    }
  });
});
