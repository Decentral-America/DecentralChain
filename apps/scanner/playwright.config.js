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
    env: {
      // Stub external API endpoints in CI so SSR loaders resolve instantly
      // instead of hanging on network requests to mainnet nodes.
      ...(process.env.CI
        ? {
            DCC_DATA_SERVICE_URL: 'http://localhost:1',
            DCC_MATCHER_URL: 'http://localhost:1',
            DCC_NODE_URL: 'http://localhost:1',
          }
        : {}),
    },
    port: 5173,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
