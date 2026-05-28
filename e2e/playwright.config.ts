import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      name: 'exchange-chromium',
      testDir: './exchange',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.EXCHANGE_URL ?? 'http://localhost:3333',
      },
    },
  ],
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm --filter exchange dev',
    port: 3333,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
