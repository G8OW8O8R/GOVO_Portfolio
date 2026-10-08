import { expect, test } from "@playwright/test";
import { computeCharacterBox, imageToScreen } from "../lib/character-box";
import { PROJECT_SLOTS } from "../lib/desktop-slots";

test.describe("static desktop", () => {
  test("desktop 1536×864: Polish default, hreflang, character box and files", async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 864 });
    await page.goto("/");
    await expect(page).toHaveURL(/\/pl$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "pl");

    for (const [lang, path] of [["pl", "/pl"], ["en", "/en"], ["x-default", "/pl"]]) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`)).toHaveAttribute("href", new RegExp(`${path}$`));
    }

    // The poster sits exactly where lib/character-box.ts says.
    const box = computeCharacterBox({ width: 1536, height: 864 }, "desktop");
    const img = await page.getByRole("img", { name: /figurka 3D/i }).boundingBox();
    expect(img).not.toBeNull();
    expect(Math.abs(img!.x - box.x)).toBeLessThan(1);
    expect(Math.abs(img!.y - box.y)).toBeLessThan(1);
    expect(Math.abs(img!.width - box.width)).toBeLessThan(1);

    // Obok takes the best slot, with the "Nowy" badge.
    const files = page.getByRole("navigation", { name: "Pliki na pulpicie" });
    const obok = files.getByRole("link", { name: /Obok/ });
    await expect(obok).toHaveAttribute("href", "/pl/projekty/obok");
    await expect(obok).toContainText("Nowy");
    const slot = (await obok.locator("xpath=..").boundingBox())!;
    const [hx, hy] = imageToScreen(box, [PROJECT_SLOTS[0].x, PROJECT_SLOTS[0].y]);
    expect(Math.abs(slot.x + slot.width / 2 - hx)).toBeLessThan(1);
    expect(Math.abs(slot.y + slot.height / 2 - hy)).toBeLessThan(1);

    // Project icon matches an info icon: same size, same gap to the label.
    const about = files.getByRole("link", { name: "O mnie" });
    const iconBox = (await obok.locator("img").boundingBox())!;
    const docBox = (await about.locator("img").boundingBox())!;
    expect(Math.abs(iconBox.height - docBox.height)).toBeLessThan(1);
    expect(Math.abs(iconBox.height - 72)).toBeLessThan(2);
    const gap = async (link: typeof obok, icon: { y: number; height: number }) =>
      (await link.locator("span").last().boundingBox())!.y - (icon.y + icon.height);
    expect(Math.abs((await gap(obok, iconBox)) - (await gap(about, docBox)))).toBeLessThan(1);

    await expect(files.getByRole("link", { name: "O mnie" })).toHaveAttribute("href", "/pl/o-mnie");
    await expect(files.getByRole("link", { name: "Oferta" })).toHaveAttribute("href", "/pl/oferta");
    const cvExists = (await page.request.head("/cv/CV-PL.pdf")).ok();
    await expect(files.getByRole("link", { name: "CV.pdf" })).toHaveCount(cvExists ? 1 : 0);

    await expect(page.getByRole("link", { name: /Współpracujmy/ })).toHaveAttribute("href", "/pl/kontakt");
    const dock = page.getByRole("navigation", { name: "Kontakt i profile" });
    await expect(dock.getByRole("link")).toHaveCount(4);

    // Every file link resolves (no dead links).
    for (const href of ["/pl/projekty/obok", "/pl/o-mnie", "/pl/oferta", "/pl/kontakt", "/en/about", "/en/projects/obok"]) {
      expect((await page.request.get(href)).status(), href).toBe(200);
    }
  });

  test("phone 390×844: English home screen without horizontal scroll", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto("/en");
    const files = page.getByRole("navigation", { name: "Desktop files" });
    await expect(files.getByRole("link", { name: /Obok/ })).toHaveAttribute("href", "/en/projects/obok");
    await expect(files.getByRole("link", { name: "About me" })).toHaveAttribute("href", "/en/about");
    await expect(page.getByRole("link", { name: /Work with me/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
    await context.close();
  });
});
