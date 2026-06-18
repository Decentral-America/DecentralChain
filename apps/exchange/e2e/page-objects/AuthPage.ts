import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for all authentication flows.
 */
export class AuthPage {
  readonly page: Page;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly nextBtn: Locator;
  readonly importBtn: Locator;
  readonly seedInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.locator('input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    this.nextBtn = page.getByRole('button', { name: /next|continue|proceed/i }).first();
    this.importBtn = page.getByRole('button', { name: /import|restore|confirm/i }).first();
    this.seedInput = page
      .locator('textarea, input[placeholder*="seed"], input[placeholder*="phrase"], input[placeholder*="word"]')
      .first();
  }

  async gotoCreateAccount(): Promise<void> {
    await this.page.goto('/create-account');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoSignIn(): Promise<void> {
    await this.page.goto('/signin');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoImport(): Promise<void> {
    await this.page.goto('/import-account');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillPassword(pw: string): Promise<void> {
    await this.passwordInput.fill(pw);
  }

  async confirmPassword(pw: string): Promise<void> {
    await this.confirmPasswordInput.fill(pw);
  }

  async clickNext(): Promise<void> {
    await this.nextBtn.click();
  }

  async fillSeedWords(words: string[]): Promise<void> {
    const wordInputs = await this.page
      .locator('input[name*="word"], input[placeholder*="word"]')
      .all();
    if (wordInputs.length >= words.length) {
      for (let i = 0; i < words.length; i++) {
        await wordInputs[i].fill(words[i]);
      }
    } else {
      await this.seedInput.fill(words.join(' '));
    }
  }

  async clickImport(): Promise<void> {
    await this.importBtn.click();
  }

  async expectVisible(): Promise<void> {
    await expect(this.page.locator('body')).not.toBeEmpty();
    const formElement = this.page.locator('input, textarea, form').first();
    await expect(formElement).toBeVisible({ timeout: 10_000 });
  }
}
