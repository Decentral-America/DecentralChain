import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  retries: 1,
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5173',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
