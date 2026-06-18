import { defineConfig, devices } from '@playwright/test';

/**
 * Exchange app — enterprise-grade Playwright configuration.
 *
 * Three-browser matrix (chromium, firefox, webkit) to catch cross-browser
 * regressions before they reach users.  Video and screenshots are retained
 * only on failure to keep CI artifacts small.
 */
export default defineConfig({
  /* Fail the build on CI if a test is accidentally left in .only mode */
  forbidOnly: !!process.env.CI,

  /* Run tests in parallel across files */
  fullyParallel: true,

  /* Browser project matrix */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
  ],

  /* Two retries in CI, none locally */
  retries: process.env.CI ? 2 : 0,

  /* Directory containing all spec files */
  testDir: './e2e',

  /* Per-test timeout */
  timeout: 30_000,

  use: {
    /* All requests go through the dev server */
    baseURL: 'http://localhost:5173',

    headless: true,

    /* Screenshots only attached when a test fails */
    screenshot: 'only-on-failure',

    /* Traces on first retry help diagnose flaky tests */
    trace: 'on-first-retry',

    /* Video retained only when a test fails */
    video: 'retain-on-failure',
  },

  /* Spin up the Vite dev server automatically */
  webServer: {
    command: 'pnpm dev',
    port: 5173,
    /* In CI always start fresh; locally reuse a running server */
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
