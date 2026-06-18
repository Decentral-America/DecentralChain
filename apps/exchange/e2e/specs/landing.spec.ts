/**
 * Exchange — landing page spec.
 */
import { expect, test } from '@playwright/test';
import { LandingPage } from '../page-objects/LandingPage';

test.describe('Landing page', () => {
  test('page loads with a non-empty body', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('hero / main section is visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    await landing.expectVisible();
  });

  test('"Get Started" CTA is visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    const cta = page
      .getByRole('link', { name: /get started|create account|start|open|launch/i })
      .first()
      .or(page.getByRole('button', { name: /get started|create account|start|open|launch/i }).first());
    await expect(cta).toBeVisible({ timeout: 10_000 });
  });

  test('"Get Started" CTA navigates to account creation', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    const cta = page
      .getByRole('link', { name: /get started|create account|start|open|launch/i })
      .first()
      .or(page.getByRole('button', { name: /get started|create account|start|open|launch/i }).first());
    await Promise.all([
      page.waitForURL(/\/(create-account|signup|welcome|sign)/i, { timeout: 15_000 }),
      cta.click(),
    ]).catch(() => {});
    const onAuthPage = page.url().match(/\/(create-account|signup|welcome|sign)/i) !== null;
    const formRendered = await page.locator('input, form').first().isVisible().catch(() => false);
    expect(onAuthPage || formRendered, 'CTA should lead to auth flow').toBe(true);
  });

  test('sign-in link is present', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.goto();
    const signIn = page
      .getByRole('link', { name: /sign.?in|log.?in/i })
      .first()
      .or(page.getByRole('button', { name: /sign.?in|log.?in/i }).first());
    await expect(signIn).toBeVisible({ timeout: 10_000 });
  });
});
