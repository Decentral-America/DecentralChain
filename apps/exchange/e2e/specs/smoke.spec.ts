/**
 * Exchange — smoke spec.
 *
 * Validates that every route returns <500, renders a non-empty body,
 * and that the landing page has no unhandled JS errors.
 */
import { expect, test } from '@playwright/test';

async function expectPageLoads(
  page: import('@playwright/test').Page,
  path: string,
): Promise<void> {
  const response = await page.goto(path);
  expect(response?.status(), `${path} should not return a server error`).toBeLessThan(500);
  await expect(page.locator('body')).not.toBeEmpty();
}

test.describe('Route smoke — public routes', () => {
  const publicRoutes = [
    '/',
    '/welcome',
    '/signup',
    '/create-account',
    '/signin',
    '/sign-in',
    '/import-account',
    '/save-seed',
    '/restore-backup',
    '/import/ledger',
  ];
  for (const route of publicRoutes) {
    test(`${route} loads without server error`, async ({ page }) => {
      await expectPageLoads(page, route);
    });
  }
});

test.describe('Route smoke — protected routes redirect, not error', () => {
  const protectedRoutes = [
    '/desktop/wallet',
    '/desktop/wallet/portfolio',
    '/desktop/wallet/transactions',
    '/desktop/wallet/leasing',
    '/desktop/wallet/aliases',
    '/desktop/wallet/account-manager',
    '/desktop/dex',
    '/desktop/settings',
    '/desktop/bridge',
    '/desktop/markets',
    '/desktop/orderbook',
    '/desktop/analytics',
    '/desktop/messages',
    '/desktop/create-token',
  ];
  for (const route of protectedRoutes) {
    test(`${route} redirects or loads without server error`, async ({ page }) => {
      await expectPageLoads(page, route);
    });
  }
});

test.describe('Navigation bar', () => {
  test('renders on the landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const nav = page.locator('header, nav, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Console errors', () => {
  test('no unhandled JS errors on landing page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(
      errors.filter(
        (e) => !e.includes('ResizeObserver loop') && !e.includes('Non-Error promise rejection'),
      ),
    ).toHaveLength(0);
  });

  test('CSS and JS assets load on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const styleSheetCount = await page.evaluate(() => document.styleSheets.length);
    expect(styleSheetCount).toBeGreaterThan(0);
    const hasModuleScripts = await page.evaluate(
      () => document.querySelectorAll('script[type="module"]').length > 0,
    );
    expect(hasModuleScripts).toBe(true);
  });
});

test.describe('Error handling', () => {
  test('unknown route does not produce 500', async ({ page }) => {
    const response = await page.goto('/this-route-xyz-does-not-exist');
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
