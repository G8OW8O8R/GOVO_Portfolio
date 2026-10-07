import { expect, test, type Page } from "@playwright/test";

/**
 * Contact form against the production build started with CONTACT_DRY_RUN=1
 * (playwright.config.ts): the whole server action runs – validation, honeypot,
 * rate limit – only the provider call is skipped. Each test gets its own
 * client IP (x-forwarded-for), so the limits don't leak between tests.
 */

const ip = () => `203.0.113.${Math.floor(Math.random() * 250) + 1}`;

/** Hydrated: the e-mail line is assembled in the browser only after hydration. */
async function openContact(page: Page, path = "/pl/kontakt") {
  await page.goto(path);
  await expect(page.getByText(/@gmail\.com/)).toBeVisible();
}

async function fill(page: Page, { name = "Anna Nowak", email = "anna@example.com", message = "Potrzebuję strony dla gabinetu." } = {}) {
  await page.getByLabel("Imię").fill(name);
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByRole("radio", { name: "Strona dla firmy" }).check();
  await page.getByRole("radio", { name: "1–3 tys." }).check();
  await page.getByLabel("Wiadomość").fill(message);
}

test.describe("contact form", () => {
  test.use({ viewport: { width: 1536, height: 864 } });

  test("validates, sends, then rate-limits a 4th message in 10 minutes", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": ip() });
    await openContact(page);
    const dialog = page.getByRole("dialog", { name: "Kontakt" });

    // client-side Zod: nothing is sent, errors are announced on the fields
    await dialog.getByRole("button", { name: "Wyślij wiadomość" }).click();
    await expect(dialog.getByText("Uzupełnij to pole.").first()).toBeVisible();
    await expect(dialog.getByText("Wybierz, czego dotyczy wiadomość.")).toBeVisible();
    await expect(page.getByLabel("Imię")).toBeFocused();
    await page.getByLabel("E-mail", { exact: true }).fill("anna@");
    await page.getByLabel("E-mail", { exact: true }).blur();
    await expect(dialog.getByText("Sprawdź adres e-mail.")).toBeVisible();

    // job offer: no budget field
    await page.getByRole("radio", { name: "Oferta pracy" }).check();
    await expect(page.getByRole("radio", { name: "Do 1 000 zł" })).toHaveCount(0);

    for (let i = 1; i <= 3; i++) {
      await fill(page);
      await dialog.getByRole("button", { name: "Wyślij wiadomość" }).click();
      await expect(dialog.getByText("Dzięki! Odpiszę zwykle w ciągu doby.")).toBeVisible();
      await dialog.getByRole("button", { name: "Napisz kolejną wiadomość" }).click();
    }
    await fill(page);
    await dialog.getByRole("button", { name: "Wyślij wiadomość" }).click();
    await expect(dialog.getByText(/Spróbuj ponownie za \d+ min/)).toBeVisible();
    // the message stays in the form
    await expect(page.getByLabel("Wiadomość")).toHaveValue("Potrzebuję strony dla gabinetu.");
  });

  test("a filled honeypot looks sent but does not count (nor send)", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": ip() });
    await openContact(page);
    const dialog = page.getByRole("dialog", { name: "Kontakt" });
    for (let i = 1; i <= 4; i++) {
      await fill(page);
      await page.locator('input[name="website"]').evaluate((el: HTMLInputElement) => (el.value = "https://spam.example"));
      await dialog.getByRole("button", { name: "Wyślij wiadomość" }).click();
      await expect(dialog.getByText("Dzięki! Odpiszę zwykle w ciągu doby.")).toBeVisible();
      await dialog.getByRole("button", { name: "Napisz kolejną wiadomość" }).click();
    }
    // the same IP can still send for real: bot attempts never touched the limit
    await fill(page);
    await dialog.getByRole("button", { name: "Wyślij wiadomość" }).click();
    await expect(dialog.getByText("Dzięki! Odpiszę zwykle w ciągu doby.")).toBeVisible();
  });

  test("Pricing presets subject and budget; the e-mail line is assembled in the browser", async ({ page }) => {
    await page.goto("/pl/oferta#cennik");
    await page.getByRole("link", { name: /Napisz, ile chcesz wydać/ }).click();
    await expect(page).toHaveURL(/\/pl\/kontakt\?budzet=do-1000&temat=strona$/);
    await expect(page.getByRole("radio", { name: "Do 1 000 zł" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Strona dla firmy" })).toBeChecked();
    // e-mail never in the server HTML, assembled in the browser for the fallback line
    await expect(page.getByText("Wolisz maila?")).toBeVisible();
    await expect(page.getByText(/@gmail\.com/)).toBeVisible();
  });
});
