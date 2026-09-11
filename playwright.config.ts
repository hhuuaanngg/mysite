import { defineConfig, devices } from "@playwright/test";

const externalOrigin = process.env.SITE_TEST_ORIGIN;

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  use: {
    baseURL: externalOrigin || "http://127.0.0.1:5690",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: externalOrigin ? undefined : {
    command: "node scripts/preview.mjs --host 127.0.0.1 --port 5690",
    url: "http://127.0.0.1:5690",
    reuseExistingServer: false,
  },
});
