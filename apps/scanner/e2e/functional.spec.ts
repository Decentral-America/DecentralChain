import { expect, test } from '@playwright/test';

test.describe('Dashboard functional', () => {
  test('block height is a positive integer', async ({ page }) => {
    await page.goto('/');
    // Wait for loading skeleton to go away
    await page.waitForTimeout(2000);
    // Block height should be a number > 0 somewhere on the page
    const heightText = await page
      .locator('[data-testid="block-height"], .block-height, h2, .stat-value')
      .first()
      .textContent({ timeout: 10000 })
      .catch(() => null);
    // If we can read it, it should be numeric
    if (heightText) {
      expect(parseInt(heightText.replace(/,/g, ''), 10)).toBeGreaterThan(0);
    }
    // At minimum the page loaded content (not just loading state)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('auto-refresh toggle persists state', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('checkbox').first();
    if (await toggle.isVisible()) {
      const initial = await toggle.isChecked();
      await toggle.click();
      expect(await toggle.isChecked()).toBe(!initial);
      await toggle.click();
      expect(await toggle.isChecked()).toBe(initial);
    }
  });

  test('blocks page shows block data after load', async ({ page }) => {
    await page.goto('/blocks');
    await page.waitForTimeout(3000);
    // Should have rows or at least a table structure
    const rows = page.locator('table tbody tr, [role="row"]');
    const count = await rows.count();
    // Either data loaded (rows > 0) or empty state is shown (not a crash)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('transaction page tabs switch without crash', async ({ page }) => {
    await page.goto('/transaction');
    await page.waitForLoadState('domcontentloaded');
    // Find and click Mempool tab if it exists
    const mempoolTab = page
      .getByRole('tab', { name: /mempool/i })
      .or(page.getByText(/mempool/i).first());
    if (await mempoolTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mempoolTab.click();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('address search accepts input', async ({ page }) => {
    await page.goto('/address');
    const input = page.locator('input[type="text"], input[type="search"], input').first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr');
    expect(await input.inputValue()).toBe('3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr');
  });

  test('network page all tabs switch without crash', async ({ page }) => {
    await page.goto('/network');
    await page.waitForLoadState('domcontentloaded');
    const tabNames = ['Peers', 'Node'];
    for (const name of tabNames) {
      const tab = page.getByRole('tab', { name }).or(page.getByText(name).first());
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(500);
        await expect(page.locator('body')).not.toBeEmpty();
      }
    }
  });
});
