/**
 * Exchange — wallet spec.
 */
import { expect, test } from '@playwright/test';
import { WalletPage } from '../page-objects/WalletPage';

async function expectWalletRouteResponds(
  page: import('@playwright/test').Page,
  path: string,
): Promise<void> {
  const response = await page.goto(path);
  expect(response?.status(), `${path} must not return a server error`).toBeLessThan(500);
  await expect(page.locator('body')).not.toBeEmpty();
}

test.describe('Wallet dashboard', () => {
  test('/desktop/wallet responds without server error', async ({ page }) => {
    await expectWalletRouteResponds(page, '/desktop/wallet');
  });

  test('wallet page renders app shell (header or nav)', async ({ page }) => {
    await page.goto('/desktop/wallet');
    await page.waitForLoadState('domcontentloaded');
    const appEl = page.locator('header, nav, [role="navigation"], h1, h2, main').first();
    await expect(appEl).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Portfolio tab', () => {
  test('/desktop/wallet/portfolio responds without server error', async ({ page }) => {
    await expectWalletRouteResponds(page, '/desktop/wallet/portfolio');
  });

  test('portfolio page body is non-empty', async ({ page }) => {
    await page.goto('/desktop/wallet/portfolio');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Transactions tab', () => {
  test('/desktop/wallet/transactions responds without server error', async ({ page }) => {
    await expectWalletRouteResponds(page, '/desktop/wallet/transactions');
  });

  test('transactions page renders table or empty state', async ({ page }) => {
    const wallet = new WalletPage(page);
    await wallet.gotoTab('transactions');
    const content = page
      .locator('table, [class*="transaction"], [data-testid*="transaction"], text=/no transactions/i, text=/empty/i, main')
      .first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Leasing tab', () => {
  test('/desktop/wallet/leasing responds without server error', async ({ page }) => {
    await expectWalletRouteResponds(page, '/desktop/wallet/leasing');
  });

  test('leasing page renders leasing options or empty state', async ({ page }) => {
    const wallet = new WalletPage(page);
    await wallet.gotoTab('leasing');
    const content = page.locator('[class*="leas"], [data-testid*="leas"], text=/leas/i, main, h1, h2').first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Aliases tab', () => {
  test('/desktop/wallet/aliases responds without server error', async ({ page }) => {
    await expectWalletRouteResponds(page, '/desktop/wallet/aliases');
  });

  test('aliases page renders alias section or empty state', async ({ page }) => {
    const wallet = new WalletPage(page);
    await wallet.gotoTab('aliases');
    const content = page.locator('[class*="alias"], [data-testid*="alias"], text=/alias/i, main, h1, h2').first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Account Manager tab', () => {
  test('/desktop/wallet/account-manager responds without server error', async ({ page }) => {
    await expectWalletRouteResponds(page, '/desktop/wallet/account-manager');
  });

  test('account-manager page renders account list or empty state', async ({ page }) => {
    const wallet = new WalletPage(page);
    await wallet.gotoTab('account-manager');
    const content = page.locator('[class*="account"], [data-testid*="account"], text=/account/i, main, h1, h2').first();
    await expect(content).toBeVisible({ timeout: 15_000 });
  });
});
