import { expect, test } from "@playwright/test";

/** A4 printable height (297 − 2 × 12 mm) in CSS px. */
const PRINTABLE_PX = (273 / 25.4) * 96;

test.describe("CV", () => {
  test.use({ viewport: { width: 1536, height: 864 } });

  test("window with the CV, PDF in the page language, one printed A4 page", async ({ page }) => {
    await page.goto("/pl/cv");
    const dialog = page.getByRole("dialog", { name: "CV.pdf" });
    const sheet = dialog.locator("[data-cv-sheet]");
    await expect(sheet.getByRole("heading", { name: "Piotr Goworek" })).toBeVisible();
    await expect(sheet.getByText("Dostępny od zaraz")).toBeVisible();
    // the e-mail is assembled in the browser, never in the server HTML
    await expect(sheet.getByRole("link", { name: "kontakt@govodigital.com" })).toHaveAttribute("href", "mailto:kontakt@govodigital.com");
    expect(await (await page.request.get("/pl/cv")).text()).not.toContain("kontakt@govodigital.com");

    // projects: newest first, the portfolio always last, at most three
    const projects = sheet.locator("ol > li h4");
    await expect(projects.first()).toHaveText("Obok");
    await expect(projects.last()).toHaveText("Portfolio GOVO DIGITAL");
    expect(await projects.count()).toBeLessThanOrEqual(3);
    await expect(sheet.getByText(/Wyrażam zgodę/)).toBeVisible();

    const download = dialog.getByRole("link", { name: "Pobierz PDF" });
    await expect(download).toHaveAttribute("href", "/cv/CV-PL.pdf");
    const pdf = await page.request.get("/cv/CV-PL.pdf");
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    await expect(dialog.getByRole("button", { name: "Drukuj" })).toBeVisible();

    // print: only the sheet, on one page, without the window chrome
    await page.emulateMedia({ media: "print" });
    await expect(dialog.getByRole("button", { name: "Drukuj" })).toBeHidden();
    await expect(dialog.getByText("CV.pdf", { exact: true })).toBeHidden();
    const box = await sheet.evaluate((el) => ({ top: el.getBoundingClientRect().top, height: el.scrollHeight }));
    expect(box.top).toBeLessThan(1);
    expect(box.height).toBeLessThanOrEqual(PRINTABLE_PX);
  });

  test("English CV: English PDF, no GDPR clause", async ({ page }) => {
    await page.goto("/en/cv");
    const dialog = page.getByRole("dialog", { name: "CV.pdf" });
    await expect(dialog.getByRole("link", { name: "Download PDF" })).toHaveAttribute("href", "/cv/CV-EN.pdf");
    await expect(dialog.getByText("Available now")).toBeVisible();
    await expect(dialog.getByText(/RODO|GDPR/)).toHaveCount(0);
  });
});
