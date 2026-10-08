# GOVO DIGITAL – portfolio

Next.js (App Router), TypeScript, Tailwind, pnpm.

```bash
pnpm install
pnpm dev        # http://localhost:3000/pl
pnpm build      # najpierw generuje PDF-y CV (prebuild), potem buduje stronę
pnpm test       # testy jednostkowe (lib/)
pnpm e2e        # Playwright
```

## CV (PDF)

`public/cv/CV-PL.pdf` i `CV-EN.pdf` generuje `scripts/build-cv.ts` z `/pl/cv?print` i `/en/cv?print` (Chromium przez Playwright). Na Vercelu/CI generowanie jest pomijane, używane są pliki z repozytorium.

**Po zmianie treści CV** (`content/profile/cv.ts`, umiejętności, projekty, `SITE_URL`) uruchom lokalnie `pnpm build` (lub `npm run build`) i zacommituj `public/cv/CV-*.pdf`. Same PDF-y wygenerujesz też przez `pnpm cv`.

Skrypt korzysta z działającego `pnpm dev` albo uruchamia własny serwer. Zgłasza błąd, gdy CV nie mieści się na jednej stronie A4. Jeśli brakuje Chromium: `pnpm exec playwright install chromium`.
