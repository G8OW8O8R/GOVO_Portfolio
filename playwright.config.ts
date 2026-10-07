import { defineConfig } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "e2e",
  outputDir: ".tmp/test-results",
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    channel: "chrome",
  },
  webServer: {
    command: `pnpm build && pnpm start -p ${port}`,
    url: `http://localhost:${port}/pl`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
