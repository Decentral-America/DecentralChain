/**
 * Exchange — settings spec.
 */
import { expect, test } from '@playwright/test';
import { SettingsPage } from '../page-objects/SettingsPage';

test.describe('Settings page', () => {
  test('/desktop/settings responds without server error', async ({ page }) => {
    const response = await page.goto('/desktop/settings');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('settings page renders app shell or redirect', async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.goto();
    const el = page.locator('header, nav, main, h1, h2, [role="navigation"]').first();
    await expect(el).toBeVisible({ timeout: 10_000 });
  });

  test('all setting categories visible when authenticated', async ({ page }) => {
    test.skip(!process.env.TEST_SEED, 'Full settings UI requires authenticated session');
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.expectAllSectionsVisible();
  });
});

test.describe('Settings sections — authenticated', () => {
  test('general settings section accessible', async ({ page }) => {
    test.skip(!process.env.TEST_SEED, 'Requires TEST_SEED');
    const settings = new SettingsPage(page);
    await settings.goto();
    const general = page
      .getByRole('tab', { name: /general/i }).first()
      .or(page.getByRole('button', { name: /general/i }).first())
      .or(page.locator('text=/general/i').first());
    await expect(general).toBeVisible({ timeout: 10_000 });
  });

  test('security settings section accessible', async ({ page }) => {
    test.skip(!process.env.TEST_SEED, 'Requires TEST_SEED');
    const settings = new SettingsPage(page);
    await settings.goto();
    const security = page
      .getByRole('tab', { name: /security/i }).first()
      .or(page.getByRole('button', { name: /security/i }).first())
      .or(page.locator('text=/security/i').first());
    await expect(security).toBeVisible({ timeout: 10_000 });
  });

  test('network settings section accessible', async ({ page }) => {
    test.skip(!process.env.TEST_SEED, 'Requires TEST_SEED');
    const settings = new SettingsPage(page);
    await settings.goto();
    const network = page
      .getByRole('tab', { name: /network/i }).first()
      .or(page.getByRole('button', { name: /network/i }).first())
      .or(page.locator('text=/network/i').first());
    await expect(network).toBeVisible({ timeout: 10_000 });
  });

  test('language setting is accessible', async ({ page }) => {
    test.skip(!process.env.TEST_SEED, 'Requires TEST_SEED');
    const settings = new SettingsPage(page);
    await settings.goto();
    const language = page
      .getByRole('tab', { name: /language/i }).first()
      .or(page.getByRole('button', { name: /language/i }).first())
      .or(page.locator('text=/language/i').first());
    await expect(language).toBeVisible({ timeout: 10_000 });
  });
});
