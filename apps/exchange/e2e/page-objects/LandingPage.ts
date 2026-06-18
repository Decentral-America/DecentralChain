import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object Model for the Exchange landing page (/).
 */
export class LandingPage {
  readonly page: Page;
  readonly getStartedBtn: Locator;
  readonly signInBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.getStartedBtn = page
      .getByRole('link', { name: /get started|create account|start/i })
      .first()
      .or(page.getByRole('button', { name: /get started|create account|start/i }).first());
    this.signInBtn = page
      .getByRole('link', { name: /sign.?in|log.?in/i })
      .first()
      .or(page.getByRole('button', { name: /sign.?in|log.?in/i }).first());
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.locator('body')).not.toBeEmpty();
    const heroOrHeading = this.page
      .locator('h1, h2, [class*="hero"], [class*="landing"], [data-testid*="hero"]')
      .first();
    await expect(heroOrHeading).toBeVisible({ timeout: 10_000 });
  }
}
