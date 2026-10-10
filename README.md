<p align="center">
  <a href="https://www.govodigital.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset=".github/readme/logo-light.svg">
      <img src="public/brand/logo.svg" alt="GOVO DIGITAL" width="200">
    </picture>
  </a>
</p>

<p align="center">
  <strong>Piotr Goworek — frontend developer</strong><br>
  <a href="https://www.govodigital.com">govodigital.com</a> · <a href="https://www.govodigital.com/en">English version</a>
</p>

![The GOVO desktop: the character looks at the Obok project file under the cursor](.github/readme/desktop.webp)

My portfolio, built as a living desktop. In the middle stands a black-and-white character rendered in WebGL2 that follows your cursor; the files around it open windows with a case study, services, pricing and my CV. Every window has its own URL, and the whole site is available in Polish and English. All graphics and video on the site are generated and edited by me.

## Highlights

- **WebGL2 character, no libraries.** One canvas composites separate layers: the base image, irises clipped by eye masks, highlights, eyelids and sparkles on the pendant, then warps the frame for breathing, a slight head turn and a chain that swings with a delay. The gaze follows the cursor on a spring and looks at the file under it, the open window or the focused form field. An end-to-end test checks a median frame time under 17.5 ms (60 fps) with the CPU throttled 4×. Without WebGL2, on slow devices and with reduced motion it falls back to a still image.
- **Windows and motion.** Files open as windows that grow out of their icon. Each window is server-rendered at its own address and works with the browser's back button. Animations use only transform and opacity; with `prefers-reduced-motion` content renders in its final state, the intro becomes a plain fade and the custom cursor is off.
- **CV generated from the site.** The CV is a regular page; a build script prints it to PDF in Chromium for both languages and fails if it does not fit on one A4 page.
- **SEO.** Canonical URLs, hreflang with x-default, a sitemap of every page in both languages, JSON-LD (Person, CreativeWork, Service with Offer, BreadcrumbList), Open Graph images, and 301 redirects for every address of the previous site.
- **Performance.** Images are pre-encoded to AVIF and WebP with hashed file names and a one-year cache; the character's textures are decoded in a worker.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Motion, Zod, WebGL2, Vitest, Playwright, Vercel.

## Lighthouse

Measured on production (`https://www.govodigital.com`) on 2026-10-10: Lighthouse 12.8.2, headless Chrome 154, default simulated throttling (mobile: Moto G Power on slow 4G with a 4× slower CPU; desktop: the `desktop` preset). Three runs per row, each value is the median of the three.

| Page | Device | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Speed Index |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| [`/pl`](https://www.govodigital.com/pl) | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.7 s | 2 ms | 0 | 0.7 s |
| [`/pl`](https://www.govodigital.com/pl) | mobile | 72 | 100 | 100 | 100 | 1.0 s | 3.5 s | 662 ms | 0 | 4.3 s |
| [`/pl/projekty/obok`](https://www.govodigital.com/pl/projekty/obok) | desktop | 99 | 100 | 100 | 100 | 0.3 s | 0.8 s | 16 ms | 0 | 0.9 s |
| [`/pl/projekty/obok`](https://www.govodigital.com/pl/projekty/obok) | mobile | 79 | 100 | 100 | 100 | 1.1 s | 4.0 s | 303 ms | 0 | 4.0 s |

Performance in the individual runs: `/pl` desktop 100 / 99 / 100, mobile 72 / 72 / 72; `/pl/projekty/obok` desktop 99 / 99 / 99, mobile 79 / 79 / 81. On mobile the largest element on both pages is the character's full-screen poster, and the blocking time is the start-up JavaScript of the desktop on a CPU slowed down 4×. Lighthouse sees the site without the intro and without statistics.

## Development

Requires Node.js, pnpm and a local Chrome for the end-to-end tests.

```bash
pnpm install
pnpm dev       # http://localhost:3000/pl
pnpm test      # unit tests
pnpm e2e       # end-to-end tests (builds and serves on port 3100)
pnpm images    # re-encode images to AVIF/WebP
pnpm cv        # regenerate the CV PDFs
```

Environment variables (`.env.local`):

- `RESEND_API_KEY` — sends messages from the contact form
- `CONTACT_FROM` — the form's sender, e.g. `GOVO DIGITAL <kontakt@govodigital.com>` (a domain verified in Resend); required in production, elsewhere it falls back to Resend's test sender
- `CONTACT_TO` — the inbox the form's messages go to (defaults to the owner's); the visitor's address is only the Reply-To, the form never e-mails it
- `CONTACT_DRY_RUN` — runs the contact form without sending e-mail (ignored in production)
- `CV_BASE_URL` — server used by `pnpm cv`; without it the script starts its own
- `NEXT_PUBLIC_UMAMI_WEBSITE_ID` — Umami website ID for visit statistics (production only, see below)

### Visit statistics

[Umami Cloud](https://umami.is): no cookies, nothing stored on the visitor's device, so no consent banner. The tracker and its endpoint go through the site's own domain (`/s/script.js` and `/s/api/send`, rewrites in `next.config.ts`), so ad blockers don't drop them. It is only on in a Vercel production build (`VERCEL_ENV=production`), never in dev or preview, and sends only from `www.govodigital.com`. It loads after the first interaction or once the intro and the character have loaded, so it never delays the first paint. Every address counts as a page view, including windows opened without a reload; `/pl` or `/en` in the URL tells the language.

| Event | Properties | When |
| --- | --- | --- |
| `window-open` | `window` (`about`, `project-obok`, `service-landing-page` …) | a window opened on the desktop (a direct entry is just a page view) |
| `service-view` | `service` (`landing-page` …) | a service page shown, also entered from search |
| `quicklook` | `file` | quick look (Space or long press), or a hover preview that stayed 800 ms (once per file per visit) |
| `cta-cooperate` | — | the "Work with me" capsule |
| `contact-sent` | `topic`, `budget` | a message actually sent (ids only, never what was typed) |
| `cv-download` | `lang` | "Download PDF" |
| `obok-open-live` | — | "Open Obok ↗" in the case study |

Not counted:

- **Your own browser:** open any page with `?nie-licz-mnie` (or `?dont-count-me`). It sets `localStorage["umami.disabled"] = "1"`, shows a short note and removes the parameter from the address. `?licz-mnie` (or `?count-me`) turns counting back on. Do this once in every browser and on every device you use.
- **Automated browsers:** when `navigator.webdriver` is true or the user agent contains `Chrome-Lighthouse` or `HeadlessChrome` (Playwright, Lighthouse, PageSpeed), the tracker never loads.

To check events: open the site in a counted browser, click around, then in the Umami dashboard go to the website → **Events** (event names and their properties) or **Realtime** (the visit as it happens). Filter by URL `/en` to see the English version. `pnpm e2e` checks every event against a stubbed tracker and sends nothing.

If the dashboard shows the server's location instead of the visitors', set `UMAMI_SEND = "relay"` in `lib/analytics.ts`: `/s/api/send` is then handled by `app/s/api/send/route.ts`, which forwards the visitor's IP in `X-Forwarded-For`.

## Rights

The source code is public for review only. The graphics, video, the character and the GOVO DIGITAL logo are © Piotr Goworek. All rights reserved: no part of this repository may be copied, modified or reused without my written permission.
