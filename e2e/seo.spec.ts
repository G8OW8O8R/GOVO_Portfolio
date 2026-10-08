import { expect, test } from "@playwright/test";
import { SITE_URL } from "../content/profile/contact";
import { pricing } from "../content/profile/pricing";
import { formatPriceFrom } from "../lib/format";
import { legacyUrls } from "../lib/redirects";

/** The Obok case study, the service, pricing and local pages, SEO files and the redirects from the previous site. */

test.describe("addresses of the previous site: 301 to their new place, or the same page", () => {
  for (const { path, status, to } of legacyUrls) {
    test(`${path} → ${status}${to ? ` ${to}` : ""}`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(status);
      if (to) expect(new URL(res.headers().location, "http://x").href.replace("http://x", "")).toBe(to);
    });
  }
});

test("sitemap, robots and structured data", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of [
    "/pl/projekty/obok",
    "/pl/uslugi/landing-page",
    "/en/services/special-project",
    "/pl/cennik",
    "/en/pricing",
    "/pl/strony-internetowe-warszawa",
  ]) {
    expect(sitemap).toContain(`<loc>${SITE_URL}${path}</loc>`);
  }
  expect(sitemap).toContain(`hreflang="en" href="${SITE_URL}/en/projects/obok"`);
  expect(sitemap).toContain(`hreflang="en" href="${SITE_URL}/en/web-design-warsaw"`);
  expect(sitemap).not.toContain("/blog");

  const html = await (await request.get("/en/projects/obok")).text();
  expect(html).toContain(`<link rel="canonical" href="${SITE_URL}/en/projects/obok"`);
  expect(html).toContain(`hrefLang="pl" href="${SITE_URL}/pl/projekty/obok"`);
  expect(html).toContain(`property="og:image" content="${SITE_URL}/projects/obok/og.jpg"`);
  expect(html).toContain('"@type":"CreativeWork"');
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(await (await request.get("/pl")).text()).toContain('"@type":"Person"');
});

test.describe("service, pricing and local pages", () => {
  const lowest = (ids: string[]) => Math.min(...pricing.packages.filter((p) => ids.includes(p.id)).map((p) => p.from));
  const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

  for (const { path, other, h1, types, from } of [
    {
      path: "/pl/uslugi/landing-page",
      other: "/en/services/landing-pages",
      h1: "Landing page, który prowadzi do jednego celu",
      types: ["Service", "Offer", "BreadcrumbList"],
      from: lowest(["landing-page"]),
    },
    {
      path: "/en/services/special-project",
      other: "/pl/uslugi/projekt-specjalny",
      h1: "Special project: a website that is an event",
      types: ["Service", "Offer", "BreadcrumbList"],
      from: lowest(["projekt-specjalny"]),
    },
    {
      path: "/pl/cennik",
      other: "/en/pricing",
      h1: "Cennik stron internetowych",
      types: ["OfferCatalog", "Offer", "BreadcrumbList"],
      from: lowest(pricing.packages.map((p) => p.id)),
    },
    {
      path: "/pl/strony-internetowe-warszawa",
      other: "/en/web-design-warsaw",
      h1: "Strony internetowe dla firm z Warszawy",
      types: ["Service", "City", "BreadcrumbList"],
      from: lowest(["wizytowka", "strona-firmowa", "landing-page"]),
    },
  ]) {
    test(`${path}: one own h1, price from pricing.ts, canonical, hreflang, structured data`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(200);
      const html = await res.text();
      const lang = path.startsWith("/pl") ? "pl" : "en";

      expect([...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => text(m[1]))).toEqual([h1]);
      const title = /<title>(.*?)<\/title>/.exec(html)?.[1] ?? "";
      expect(title).toContain(formatPriceFrom(from, lang));
      expect(title).toMatch(/ \| GOVO DIGITAL$/);
      expect(html).toContain(`<link rel="canonical" href="${SITE_URL}${path}"`);
      expect(html).toContain(`hrefLang="${lang === "pl" ? "en" : "pl"}" href="${SITE_URL}${other}"`);
      for (const type of types) expect(html).toContain(`"@type":"${type}"`);
      expect(html).toContain(`"minPrice":${from}`);
    });
  }

  test("a service page works without JavaScript: content, links and the way to Contact", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/pl/uslugi/redesign-strony");
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { level: 1 })).toHaveText("Redesign strony bez utraty pozycji w Google");
    await expect(dialog.locator('a[href="/pl/kontakt?temat=strona"]')).toHaveCount(1);
    await expect(dialog.locator('a[href="/pl/cennik"]')).not.toHaveCount(0);
    await expect(dialog.locator('a[href="/pl/projekty/obok"]')).not.toHaveCount(0);
    await context.close();
  });
});

test.describe("Obok case study", () => {
  test.use({ viewport: { width: 1536, height: 864 } });

  for (const { path, sections, pause } of [
    {
      path: "/pl/projekty/obok",
      sections: ["W skrócie", "Wyzwanie", "Najciekawsze rozwiązania", "Assety", "Technologie", "Liczby", "Czego się nauczyłem"],
      pause: "Zatrzymaj showreel",
    },
    {
      path: "/en/projects/obok",
      sections: ["In short", "The challenge", "Most interesting solutions", "Assets", "Technologies", "Numbers", "What I learned"],
      pause: "Pause the showreel",
    },
  ]) {
    test(`${path}: every section and a showreel that plays and pauses`, async ({ page }) => {
      await page.goto(path);
      const dialog = page.getByRole("dialog", { name: "Obok" });
      await expect(dialog.getByRole("heading", { level: 2, name: "Obok" })).toBeVisible();
      for (const name of sections) await expect(dialog.getByRole("heading", { name, exact: true })).toBeAttached();
      await expect(dialog.locator('a[href="https://oh-bok.vercel.app"]')).toHaveAttribute("target", "_blank");

      // in view → plays (muted); the button pauses it
      const video = dialog.locator("video");
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.muted)).toBe(true);
      await dialog.getByRole("button", { name: pause }).click();
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
      await dialog.getByRole("button", { name: /showreel/ }).click();
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(false);

      // scrolled out of view → paused
      await dialog.getByRole("heading", { name: sections.at(-1), exact: true }).scrollIntoViewIfNeeded();
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    });
  }
});
