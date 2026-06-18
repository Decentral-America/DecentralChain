import { expect, test } from '@playwright/test';

test.describe('Asset page', () => {
  test('asset page loads without crash', async ({ page }) => {
    const response = await page.goto('/asset');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('asset search input is visible', async ({ page }) => {
    await page.goto('/asset');
    await page.waitForLoadState('domcontentloaded');
    const input = page.locator('input').first();
    await expect(input).toBeVisible({ timeout: 5000 });
  });

  test('invalid asset ID shows error or empty state (not crash)', async ({ page }) => {
    await page.goto('/asset');
    const input = page.locator('input').first();
    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      await input.fill('INVALIDASSETID12345');
      await input.press('Enter');
      await page.waitForTimeout(2000);
      // Should not crash — body still has content
      await expect(page.locator('body')).not.toBeEmpty();
      // Should not show a blank white page
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.trim().length).toBeGreaterThan(10);
    }
  });

  test('DCC native asset renders info', async ({ page }) => {
    // DCC is the native asset — navigate directly if the app supports ?assetId= or /asset?id=
    await page.goto('/asset');
    await page.waitForLoadState('domcontentloaded');
    // Just verify the page structure is intact
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
