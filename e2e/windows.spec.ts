import { expect, test } from "@playwright/test";

const windows = [
  { path: "/pl/o-mnie", title: "O mnie", heading: "Piotr Goworek" },
  { path: "/pl/oferta", title: "Oferta", heading: /Strony dla firm i marek/ },
  { path: "/pl/kontakt", title: "Kontakt", heading: "Współpracujmy" },
  { path: "/pl/projekty/obok", title: "Obok", heading: "Obok" },
  { path: "/en/about", title: "About me", heading: "Piotr Goworek" },
  { path: "/en/services", title: "Services", heading: /Websites for businesses/ },
  { path: "/en/contact", title: "Contact", heading: "Work with me" },
  { path: "/en/projects/obok", title: "Obok", heading: "Obok" },
];

test.describe("desktop windows", () => {
  test.use({ viewport: { width: 1536, height: 864 } });

  test("every window URL is server-rendered and survives a reload", async ({ page }) => {
    for (const w of windows) {
      await page.goto(w.path);
      const dialog = page.getByRole("dialog", { name: w.title });
      await expect(dialog, w.path).toBeVisible();
      await expect(dialog.getByText(w.heading).first()).toBeVisible();
      await page.reload();
      await expect(page.getByRole("dialog", { name: w.title }), `${w.path} after reload`).toBeVisible();
    }
    // The e-mail is never plain text in the server HTML.
    const html = await (await page.request.get("/pl/kontakt")).text();
    expect(html).not.toContain("@gmail.com");
    // CV window only when the PDF exists.
    const cv = (await page.request.head("/cv/CV.pdf")).ok();
    expect((await page.request.get("/pl/cv")).status()).toBe(cv ? 200 : 404);
  });

  test("tabs live in the hash; without JS the hashed tab shows too", async ({ page, browser }) => {
    await page.goto("/pl/oferta#cennik");
    await expect(page.getByRole("tab", { name: "Cennik" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Masz mniejszy budżet?", { exact: false })).toBeVisible();
    await page.getByRole("tab", { name: "Proces" }).click();
    await expect(page).toHaveURL(/\/pl\/oferta#proces$/);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Rozmowa i wycena" })).toBeVisible();

    const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1536, height: 864 } });
    const p = await noJs.newPage();
    await p.goto("/pl/o-mnie#umiejetnosci");
    await expect(p.getByRole("heading", { name: "Umiejętności", level: 2 })).toBeVisible();
    await expect(p.getByText("Buduję strony, które się zapamiętuje", { exact: false })).toBeHidden();
    await noJs.close();
  });

  test("open from a file, back closes, Esc closes and focus returns, keyboard only", async ({ page }) => {
    await page.goto("/pl");
    const files = page.getByRole("navigation", { name: "Pliki na pulpicie" });

    await files.getByRole("link", { name: /Obok/ }).click();
    await expect(page).toHaveURL(/\/pl\/projekty\/obok$/);
    await expect(page.getByRole("dialog", { name: "Obok" })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/pl$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.goForward();
    await expect(page.getByRole("dialog", { name: "Obok" })).toBeVisible();
    await page.getByRole("button", { name: "Zamknij" }).first().click();
    await expect(page).toHaveURL(/\/pl$/);

    // keyboard: focus the file, Enter opens, Tab stays inside, Esc closes, focus back on the file
    const about = files.getByRole("link", { name: "O mnie" });
    await about.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "O mnie" });
    await expect(dialog).toBeVisible();
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/pl$/);
    await expect(about).toBeFocused();

    // minimise remembers the tab; full screen fills the screen
    await files.getByRole("link", { name: "Oferta" }).click();
    await page.getByRole("tab", { name: "Cennik" }).click();
    await page.getByRole("button", { name: "Minimalizuj do pliku" }).click();
    await expect(page).toHaveURL(/\/pl$/);
    await files.getByRole("link", { name: "Oferta" }).click();
    await expect(page.getByRole("tab", { name: "Cennik" })).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: "Pełny ekran" }).click();
    await expect.poll(async () => (await page.getByRole("dialog").boundingBox())?.width).toBeGreaterThan(1500);
    // the character hides while the window is full screen
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.querySelector("[data-character-poster]")!.closest("div")!).opacity)).toBe("0");

    // switching windows replaces: back from Contact returns to the desktop
    await page.getByRole("link", { name: "Napisz, ile chcesz wydać" }).click();
    await expect(page).toHaveURL(/\/pl\/kontakt\?budzet=do-1000&temat=strona$/);
    await expect(page.getByRole("radio", { name: "Do 1 000 zł" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Strona dla firmy" })).toBeChecked();
    await page.goBack();
    await expect(page).toHaveURL(/\/pl$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the character steps aside: the window never covers the face, in any frame", async ({ browser }) => {
    for (const [width, height] of [[1280, 720], [1536, 864], [1920, 1080]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.goto("/pl");
      // every animation frame: gap between the window's left edge and the face (incl. hair and ears,
      // lib/window-layout.ts FACE_BOX), while the window is visible at all
      await page.evaluate(() => {
        const w = window as unknown as { __gaps: number[] };
        w.__gaps = [];
        const poster = document.querySelector("[data-character-poster]")!;
        const t0 = performance.now();
        const loop = () => {
          const win = document.querySelector("[data-app-window]");
          if (win && +getComputedStyle(win).opacity > 0.02) {
            const p = poster.getBoundingClientRect();
            w.__gaps.push(win.getBoundingClientRect().left - (p.left + (1560 * p.width) / 2752));
          }
          if (performance.now() - t0 < 2500) requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      });
      await page.getByRole("navigation", { name: "Pliki na pulpicie" }).getByRole("link", { name: "Oferta" }).click();
      await expect(page.getByRole("dialog", { name: "Oferta" })).toBeVisible();
      await page.waitForTimeout(1500);
      const gaps = await page.evaluate(() => (window as unknown as { __gaps: number[] }).__gaps);
      expect(gaps.length, `${width}×${height} frames`).toBeGreaterThan(20);
      expect(Math.min(...gaps), `${width}×${height} closest approach`).toBeGreaterThan(0);
      // at rest the face sits at ~28% of the width
      const faceX = await page.evaluate(() => {
        const p = document.querySelector("[data-character-poster]")!.getBoundingClientRect();
        return p.left + (1372 * p.width) / 2752;
      });
      expect(Math.abs(faceX - width * 0.28)).toBeLessThan(4);
      await page.close();
    }
  });

  test("files remember where they were dragged; tidy puts them back", async ({ page }) => {
    await page.goto("/pl");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const slot = page.locator('[data-file-key="about"]');
    const start = (await slot.boundingBox())!;
    await page.mouse.move(start.x + start.width / 2, start.y + 20);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(start.x + start.width / 2 + i * 12, start.y + 20 + i * 6);
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => localStorage.getItem("govo:desktop-positions:v1"))).not.toBeNull();
    await expect(page).toHaveURL(/\/pl$/); // a drag never opens the file
    const moved = (await slot.boundingBox())!;
    expect(moved.x - start.x).toBeGreaterThan(100);

    await page.reload();
    const reloaded = (await slot.boundingBox())!;
    expect(Math.abs(reloaded.x - moved.x)).toBeLessThan(2);

    await page.getByRole("button", { name: /Uporządkuj/ }).click();
    await expect.poll(async () => Math.abs((await slot.boundingBox())!.x - start.x)).toBeLessThan(2);
    expect(await page.evaluate(() => localStorage.getItem("govo:desktop-positions:v1"))).toBeNull();
  });
});

test("phone: windows are bottom sheets; swipe down closes", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/pl");
  await page.getByRole("navigation", { name: "Pliki na pulpicie" }).getByRole("link", { name: "O mnie" }).tap();
  const sheet = page.getByRole("dialog", { name: "O mnie" });
  await expect(sheet).toBeVisible();
  await expect.poll(async () => (await sheet.boundingBox())?.width).toBe(390);
  await expect.poll(async () => Math.round((await sheet.boundingBox())!.y)).toBe(28); // slid in

  const cdp = await context.newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", y = 0) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: 200, y }] });
  await touch("touchStart", 300);
  for (let y = 320; y <= 560; y += 20) await touch("touchMove", y);
  await touch("touchEnd");
  await expect(page).toHaveURL(/\/pl$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
  await context.close();
});
