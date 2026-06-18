/**
 * Exchange — bridge spec.
 */
import { expect, test } from '@playwright/test';

test.describe('Bridge page', () => {
  test('/desktop/bridge responds without server error', async ({ page }) => {
    const response = await page.goto('/desktop/bridge');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('bridge page renders app shell or redirect', async ({ page }) => {
    await page.goto('/desktop/bridge');
    await page.waitForLoadState('domcontentloaded');
    const el = page.locator('header, nav, main, h1, h2, [role="navigation"]').first();
    await expect(el).toBeVisible({ timeout: 10_000 });
  });

  test('deposit/withdraw options visible when authenticated', async ({ page }) => {
    test.skip(!process.env.TEST_SEED, 'Full bridge UI requires authenticated session');
    await page.goto('/desktop/bridge');
    await page.waitForLoadState('domcontentloaded');
    const depositWithdraw = page
      .getByRole('tab', { name: /deposit|withdraw/i }).first()
      .or(page.getByRole('button', { name: /deposit|withdraw/i }).first())
      .or(page.locator('text=/deposit|withdraw/i').first());
    await expect(depositWithdraw).toBeVisible({ timeout: 15_000 });
  });

  test('bridge page does not throw unhandled errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/desktop/bridge');
    await page.waitForLoadState('domcontentloaded');
    expect(
      errors.filter(
        (e) => !e.includes('ResizeObserver loop') && !e.includes('Non-Error promise rejection'),
      ),
    ).toHaveLength(0);
  });
});

test.describe('Additional exchange pages', () => {
  test('/desktop/analytics responds without server error', async ({ page }) => {
    const response = await page.goto('/desktop/analytics');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('/desktop/messages responds without server error', async ({ page }) => {
    const response = await page.goto('/desktop/messages');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('/desktop/create-token responds without server error', async ({ page }) => {
    const response = await page.goto('/desktop/create-token');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
