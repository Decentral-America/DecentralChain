import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  retries: process.env.CI ? 2 : 1,
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm run dev --port 5173',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
