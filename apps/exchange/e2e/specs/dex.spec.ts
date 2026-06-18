/**
 * Exchange — DEX spec.
 */
import { expect, test } from '@playwright/test';
import { DexPage } from '../page-objects/DexPage';

test.describe('DEX page', () => {
  test('/desktop/dex responds without server error', async ({ page }) => {
    const response = await page.goto('/desktop/dex');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('DEX page renders app shell or redirect', async ({ page }) => {
    const dex = new DexPage(page);
    await dex.goto();
    const el = page.locator('header, nav, main, h1, h2, [role="navigation"]').first();
    await expect(el).toBeVisible({ timeout: 10_000 });
  });

  test('chart area is visible when authenticated', async ({ page }) => {
    test.skip(!process.env.TEST_SEED, 'Requires TEST_SEED env var');
    const dex = new DexPage(page);
    await dex.goto();
    await dex.expectChartVisible();
  });

  test('order book or pair selector is visible when authenticated', async ({ page }) => {
    test.skip(!process.env.TEST_SEED, 'Requires TEST_SEED env var');
    const dex = new DexPage(page);
    await dex.goto();
    await dex.expectOrderBookVisible();
  });
});

test.describe('Markets page', () => {
  test('/desktop/markets responds without server error', async ({ page }) => {
    const response = await page.goto('/desktop/markets');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('markets page renders content or redirect', async ({ page }) => {
    await page.goto('/desktop/markets');
    await page.waitForLoadState('domcontentloaded');
    const content = page.locator('header, nav, main, table, [class*="market"], h1, h2').first();
    await expect(content).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('OrderBook page', () => {
  test('/desktop/orderbook responds without server error', async ({ page }) => {
    const response = await page.goto('/desktop/orderbook');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('orderbook page renders content or redirect', async ({ page }) => {
    await page.goto('/desktop/orderbook');
    await page.waitForLoadState('domcontentloaded');
    const content = page.locator('header, nav, main, [class*="order"], [class*="book"], h1, h2').first();
    await expect(content).toBeVisible({ timeout: 10_000 });
  });
});
