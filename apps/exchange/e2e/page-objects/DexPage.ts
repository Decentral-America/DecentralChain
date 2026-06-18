import { expect, type Page } from '@playwright/test';

/**
 * Page Object Model for the DEX trading interface (/desktop/dex).
 */
export class DexPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/desktop/dex');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectChartVisible(): Promise<void> {
    const chart = this.page
      .locator('canvas, [class*="chart"], [class*="trading-view"], [data-testid*="chart"]')
      .first();
    await expect(chart).toBeVisible({ timeout: 15_000 });
  }

  async expectOrderBookVisible(): Promise<void> {
    const orderBook = this.page
      .locator(
        '[class*="order-book"], [class*="orderbook"], [data-testid*="order"], [class*="pair"]',
      )
      .first()
      .or(this.page.locator('table, [role="table"]').first());
    await expect(orderBook).toBeVisible({ timeout: 15_000 });
  }
}
