import { test as base } from '@playwright/test';

export type AuthFixtures = {
  newAccountSeed: string;
  hasFundedAccount: boolean;
};

export const test = base.extend<AuthFixtures>({
  hasFundedAccount: async (_fixtures, use) => {
    await use(!!process.env.TEST_SEED);
  },
  newAccountSeed: async ({ page }, use) => {
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // CSP may block storage access — safe to ignore
      }
    });
    const seed =
      process.env.TEST_SEED ?? 'test seed phrase for ui structure validation only do not use';
    await use(seed);
  },
});

export { expect } from '@playwright/test';
