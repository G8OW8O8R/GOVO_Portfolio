import { expect, test } from "@playwright/test";
import { legacyUrls } from "../lib/redirects";

/** Task 4: the Obok case study, SEO files and the redirects from the previous site. */

test.describe("addresses of the previous site", () => {
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
  expect(robots).toContain("Sitemap: https://govodigital.vercel.app/sitemap.xml");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://govodigital.vercel.app/pl/projekty/obok</loc>");
  expect(sitemap).toContain('hreflang="en" href="https://govodigital.vercel.app/en/projects/obok"');
  expect(sitemap).not.toContain("/blog");

  const html = await (await request.get("/en/projects/obok")).text();
  expect(html).toContain('<link rel="canonical" href="https://govodigital.vercel.app/en/projects/obok"');
  expect(html).toContain('hrefLang="pl" href="https://govodigital.vercel.app/pl/projekty/obok"');
  expect(html).toContain('property="og:image" content="https://govodigital.vercel.app/projects/obok/og.jpg"');
  expect(html).toContain('"@type":"CreativeWork"');
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(await (await request.get("/pl")).text()).toContain('"@type":"Person"');
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
