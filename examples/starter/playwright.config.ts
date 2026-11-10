import { defineConfig } from "@playwright/test";

// `moonpeak test --e2e` starts the dev server and sets MOONPEAK_URL for you.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  use: { baseURL: process.env.MOONPEAK_URL, trace: "retain-on-failure" },
  snapshotPathTemplate: "tests/e2e/__screenshots__/{testFilePath}/{arg}{ext}",
});
