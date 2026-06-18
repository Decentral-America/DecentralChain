import { expect, test } from '@playwright/test';

const pages = ['/', '/blocks', '/transaction', '/address', '/asset', '/dexpairs', '/network'];

for (const path of pages) {
  test(`${path} has a page title`, async ({ page }) => {
    await page.goto(path);
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
    expect(title).not.toBe('undefined');
  });
}

test('navigation links have accessible text', async ({ page }) => {
  await page.goto('/');
  const navLinks = page.locator('nav a, [role="navigation"] a');
  const count = await navLinks.count();
  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      // Each nav link must have either text content or aria-label
      const hasAccessibleText =
        (text?.trim().length ?? 0) > 0 || (ariaLabel?.trim().length ?? 0) > 0;
      expect(hasAccessibleText, `Nav link ${i} has no accessible text`).toBe(true);
    }
  }
});
