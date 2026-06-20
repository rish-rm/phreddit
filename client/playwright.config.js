import { defineConfig, devices } from "@playwright/test";

const e2eMongoUri = process.env.E2E_MONGO_URI ||
  `mongodb://127.0.0.1:27017/phreddit_e2e_${Date.now()}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry"
  },
  webServer: [
    {
      command: "npm --prefix ../server start",
      url: "http://127.0.0.1:8000/api/health",
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        MONGO_URI: e2eMongoUri,
        PORT: "8000",
        SESSION_SECRET: "playwright-test-secret"
      }
    },
    {
      command: "npm run dev -- --host 127.0.0.1",
      url: "http://127.0.0.1:5173",
      timeout: 120000,
      reuseExistingServer: !process.env.CI
    }
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"]
      }
    }
  ]
});
