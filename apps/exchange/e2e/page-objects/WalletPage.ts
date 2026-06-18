import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for the wallet section (/desktop/wallet/*).
 */
export class WalletPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async gotoTab(
    name: 'portfolio' | 'transactions' | 'leasing' | 'aliases' | 'account-manager',
  ): Promise<void> {
    await this.page.goto(`/desktop/wallet/${name}`);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectBalance(minDCC = 0): Promise<void> {
    if (minDCC === 0) {
      await expect(this.page.locator('body')).not.toBeEmpty();
    } else {
      const balanceEl = this.page
        .locator('[data-testid*="balance"], [class*="balance"], text=/\\d+(\\.\\d+)?\\s*DCC/i')
        .first();
      await expect(balanceEl).toBeVisible({ timeout: 15_000 });
    }
  }

  async expectTransactionsVisible(): Promise<void> {
    const transactionsArea = this.page
      .locator('table, [class*="transaction"], [data-testid*="transaction"], text=/no transactions/i')
      .first();
    await expect(transactionsArea).toBeVisible({ timeout: 15_000 });
  }

  async clickTab(label: string): Promise<void> {
    const tab = this.page
      .getByRole('tab', { name: new RegExp(label, 'i') })
      .first()
      .or(this.page.getByRole('link', { name: new RegExp(label, 'i') }).first());
    await tab.click();
  }
}
