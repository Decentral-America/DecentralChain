import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Exchange - Smoke', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('no console errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('unknown route does not produce 500', async ({ page }) => {
    const response = await page.goto('/nonexistent-route-test');
    expect(response?.status()).not.toBe(500);
  });
});

test.describe('Exchange - Accessibility', () => {
  test('homepage passes axe-core checks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe('Exchange - Static assets', () => {
  test('CSS loads correctly', async ({ page }) => {
    await page.goto('/');
    const styleSheetCount = await page.evaluate(() => document.styleSheets.length);
    expect(styleSheetCount).toBeGreaterThan(0);
  });

  test('JS bundle executes', async ({ page }) => {
    await page.goto('/');
    const hasModuleScripts = await page.evaluate(
      () => document.querySelectorAll('script[type="module"]').length > 0,
    );
    expect(hasModuleScripts).toBe(true);
  });
});
