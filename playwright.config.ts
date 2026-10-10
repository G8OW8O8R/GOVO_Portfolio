import { join } from "node:path";
import { defineConfig, type PlaywrightTestProject } from "@playwright/test";

const port = 3100;
// The character's debug hooks (?character=debug) exist only in development,
// so its spec runs against `next dev` (output in .next/dev, so it can run
// next to `next build`; an already running dev server is reused). The
// statistics spec runs on both: counted in the build, never on dev.
const devPort = 3000;

/** The dry-run contact form writes here what it would have sent (e2e/contact.spec.ts reads it). */
export const CONTACT_DRY_RUN_FILE = join(__dirname, ".tmp", "contact-dry-run.jsonl");

// Every spec in Chrome, Firefox and WebKit. Playwright's WebKit on Windows is
// slow (software WebGL until the watchdog falls back): longer timeouts there.
const engines: { suffix: string; use: PlaywrightTestProject["use"]; timeout?: number }[] = [
  { suffix: "", use: { browserName: "chromium", channel: "chrome" } },
  { suffix: "-firefox", use: { browserName: "firefox" } },
  { suffix: "-webkit", use: { browserName: "webkit" }, timeout: 90_000 },
];

export default defineConfig({
  testDir: "e2e",
  outputDir: ".tmp/test-results",
  reporter: "list",
  projects: engines.flatMap(({ suffix, use, timeout }) => [
    { name: `production${suffix}`, testIgnore: /character\.spec/, timeout, use: { ...use, baseURL: `http://localhost:${port}` } },
    { name: `dev${suffix}`, testMatch: /(character|analytics)\.spec/, timeout, use: { ...use, baseURL: `http://localhost:${devPort}` } },
  ]),
  webServer: [
    {
      command: `pnpm build && pnpm start -p ${port}`,
      url: `http://localhost:${port}/pl`,
      reuseExistingServer: true,
      timeout: 180_000,
      // contact form: everything runs except the e-mail provider call (never on Vercel production), the request goes to a file;
      // statistics on with a made-up website id (e2e/analytics.spec.ts stubs the tracker, nothing is sent)
      env: {
        CONTACT_DRY_RUN: "1",
        CONTACT_DRY_RUN_FILE,
        CONTACT_FROM: "GOVO DIGITAL <kontakt@govodigital.com>",
        ANALYTICS_E2E: "1",
        NEXT_PUBLIC_UMAMI_WEBSITE_ID: "00000000-0000-4000-8000-000000000000",
      },
    },
    {
      command: `pnpm dev -p ${devPort}`,
      url: `http://localhost:${devPort}/pl`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
