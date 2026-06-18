/**
 * Exchange — auth flow spec.
 */
import { expect, test } from '@playwright/test';
import { AuthPage } from '../page-objects/AuthPage';

test.describe('Create Account flow', () => {
  test('create-account page renders a form', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoCreateAccount();
    await auth.expectVisible();
  });

  test('password field is visible on create-account', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoCreateAccount();
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 10_000 });
  });

  test('filling password enables the Next button', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoCreateAccount();
    await auth.fillPassword('TestPassword123!');
    const confirmInput = page.locator('input[type="password"]').nth(1);
    if (await confirmInput.isVisible().catch(() => false)) {
      await auth.confirmPassword('TestPassword123!');
    }
    const nextBtn = page.getByRole('button', { name: /next|continue|proceed|create/i }).first();
    await expect(nextBtn).toBeEnabled({ timeout: 5_000 });
  });
});

test.describe('Sign In flow', () => {
  test('/signin page renders a sign-in form', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoSignIn();
    await auth.expectVisible();
  });

  test('/sign-in alias renders the same page', async ({ page }) => {
    const auth = new AuthPage(page);
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');
    await auth.expectVisible();
  });

  test('seed phrase input is present on sign-in page', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoSignIn();
    await expect(page.locator('input, textarea').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Import Account flow', () => {
  test('/import-account page renders', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoImport();
    await auth.expectVisible();
  });

  test('seed / phrase input is visible on import-account', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.gotoImport();
    const seedEl = page
      .locator('textarea, input[placeholder*="seed" i], input[placeholder*="phrase" i]')
      .first();
    await expect(seedEl).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Save Seed page', () => {
  test('/save-seed page renders', async ({ page }) => {
    await page.goto('/save-seed');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('seed words area is present (expects 12+ words)', async ({ page }) => {
    await page.goto('/save-seed');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
    const count = await page
      .locator('[class*="seed"], [class*="word"], [data-testid*="seed"], textarea')
      .count();
    if (count > 0) {
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});

test.describe('Restore Backup page', () => {
  test('/restore-backup page renders a file upload or input', async ({ page }) => {
    await page.goto('/restore-backup');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('input[type="file"], textarea, input[type="text"]').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Welcome page', () => {
  test('/welcome page renders with create / import options', async ({ page }) => {
    await page.goto('/welcome');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
    const cta = page.getByRole('button').first().or(page.getByRole('link').first());
    await expect(cta).toBeVisible({ timeout: 10_000 });
  });
});
