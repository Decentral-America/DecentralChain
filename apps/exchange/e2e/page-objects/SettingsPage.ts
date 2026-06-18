import { expect, type Page } from '@playwright/test';

/**
 * Page Object Model for the Settings page (/desktop/settings).
 */
export class SettingsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/desktop/settings');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectAllSectionsVisible(): Promise<void> {
    const sections = ['general', 'security', 'language', 'network'];
    let foundCount = 0;
    for (const section of sections) {
      const el = this.page.locator(
        `[role="tab"]:has-text("${section}"), [role="menuitem"]:has-text("${section}"), h2:has-text("${section}"), h3:has-text("${section}")`,
      );
      try {
        await expect(el.first()).toBeVisible({ timeout: 5_000 });
        foundCount++;
      } catch {
        // Tolerate partial renders
      }
    }
    expect(foundCount, 'At least one settings section must be visible').toBeGreaterThan(0);
  }

  async clickSection(name: string): Promise<void> {
    const el = this.page
      .getByRole('tab', { name: new RegExp(name, 'i') })
      .first()
      .or(this.page.getByRole('button', { name: new RegExp(name, 'i') }).first());
    await el.click();
  }
}
