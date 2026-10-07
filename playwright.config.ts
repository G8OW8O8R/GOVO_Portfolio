import { defineConfig } from "@playwright/test";

const port = 3100;
// The character's debug hooks (?character=debug) exist only in development,
// so its spec runs against `next dev` (output in .next/dev, so it can run
// next to `next build`; an already running dev server is reused).
const devPort = 3000;

export default defineConfig({
  testDir: "e2e",
  outputDir: ".tmp/test-results",
  reporter: "list",
  use: {
    channel: "chrome",
  },
  projects: [
    { name: "production", testIgnore: /character\.spec/, use: { baseURL: `http://localhost:${port}` } },
    { name: "dev", testMatch: /character\.spec/, use: { baseURL: `http://localhost:${devPort}` } },
  ],
  webServer: [
    {
      command: `pnpm build && pnpm start -p ${port}`,
      url: `http://localhost:${port}/pl`,
      reuseExistingServer: true,
      timeout: 180_000,
      // contact form: everything runs except the e-mail provider call (never on Vercel production)
      env: { CONTACT_DRY_RUN: "1" },
    },
    {
      command: `pnpm dev -p ${devPort}`,
      url: `http://localhost:${devPort}/pl`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
