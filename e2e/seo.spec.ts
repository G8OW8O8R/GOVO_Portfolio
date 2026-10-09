import { expect, test, type APIRequestContext } from "@playwright/test";
import { SITE_URL } from "../content/profile/contact";
import { pricing } from "../content/profile/pricing";
import { formatPriceFrom } from "../lib/format";
import { locales } from "../lib/i18n";
import { legacyUrls } from "../lib/redirects";
import { href, serviceIds } from "../lib/routes";

/** The Obok case study, the service, pricing and local pages, SEO files and the redirects from the previous site. */

/** Status and target of one request, redirects not followed. */
async function hop(request: APIRequestContext, path: string) {
  const res = await request.get(path, { maxRedirects: 0 });
  const location = res.headers().location;
  return { status: res.status(), to: location ? new URL(location, "http://x").href.replace("http://x", "") : undefined };
}

test.describe("addresses of the previous site: 301 to their new place, or the same page", () => {
  for (const { path, status, to } of legacyUrls) {
    test(`${path} → ${status}${to ? ` ${to}` : ""}`, async ({ request }) => {
      const res = await hop(request, path);
      expect(res.status).toBe(status);
      if (to) expect(res.to).toBe(to);
    });
  }
});

test("every redirect is one 301: no 307 or 308, no chain", async ({ request }) => {
  const paths = [
    ...legacyUrls.map(({ path }) => path),
    // no language prefix (proxy), English segments served from Polish folders
    "/",
    "/o-mnie",
    "/uslugi",
    "/uslugi/landing-page",
    "/umiejetnosci",
    "/en/o-mnie",
    "/en/oferta",
    "/en/cennik",
    "/en/uslugi/website-redesign",
  ];
  for (const path of paths) {
    const first = await hop(request, path);
    if (first.status === 200) continue;
    expect(first.status, path).toBe(301);
    const end = await hop(request, first.to!.split("#")[0]);
    expect(end.status, `${path} → ${first.to}`).toBe(200);
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
      types: ["Service", "Offer", "BreadcrumbList", "FAQPage", "Country"],
      from: lowest(["landing-page"]),
    },
    {
      path: "/en/services/special-project",
      other: "/pl/uslugi/projekt-specjalny",
      h1: "Special project: a website that is an event",
      types: ["Service", "Offer", "BreadcrumbList", "FAQPage"],
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
      types: ["Service", "City", "BreadcrumbList", "FAQPage"],
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
      // English service pages serve the world; only the local page names a city
      if (path.startsWith("/en/services/")) expect(html).not.toContain('"areaServed"');
      if (!path.includes("warsza") && !path.includes("warsaw")) expect(html).not.toContain('"@type":"City"');
      expect(html).toContain(`"minPrice":${from}`);
    });
  }

  test("a service page works without JavaScript: content, links and the way to Contact", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/pl/uslugi/redesign-strony");
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { level: 1 })).toHaveText("Redesign strony, który nie gubi tego, co działa");
    for (const name of ["Dla kogo", "Co dostajesz", "Jak pracuję", "Cena i czas realizacji", "Pytania"]) {
      await expect(dialog.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
    }
    await expect(dialog.locator('a[href^="/pl/kontakt"]')).toHaveCount(1);
    await expect(dialog.locator('a[href="/pl/kontakt?temat=strona"]')).toHaveCount(1);
    await expect(dialog.locator('a[href="/pl/cennik"]')).not.toHaveCount(0);
    await expect(dialog.locator('a[href="/pl/projekty/obok"]')).not.toHaveCount(0);
    await context.close();
  });

  test("the Offer and Pricing link every service page, and every service page links Obok", async ({ request }) => {
    const services = serviceIds.flatMap((id) => locales.map((lang) => ({ lang, path: href(lang, "service", id) })));
    for (const from of ["/pl/oferta", "/pl/cennik", "/en/services", "/en/pricing"]) {
      const html = await (await request.get(from)).text();
      for (const { path } of services.filter(({ lang }) => from.startsWith(`/${lang}`))) expect(html, from).toContain(`href="${path}"`);
    }
    for (const { lang, path } of services) {
      expect(await (await request.get(path)).text(), path).toContain(`href="${href(lang, "project", "obok")}"`);
    }
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
