import { defineConfig, devices } from '@playwright/test';

/**
 * Live smoke: real Chromium against the deployed testnet pages. Separate from
 * playwright.config.ts (local dev servers) and not picked up by `nx affected -t e2e`.
 *
 *   pnpm --filter e2e exec playwright test -c playwright.live.config.ts
 */
export default defineConfig({
  forbidOnly: !!process.env.CI,
  projects: [{ name: 'live-chromium', testDir: './live', use: { ...devices['Desktop Chrome'] } }],
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report-live' }]]
    : [['list']],
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  use: { headless: true, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
