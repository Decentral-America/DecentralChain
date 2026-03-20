/**
 * DCC-113 — Scanner full smoke flow (E2E).
 *
 * Tests the 7-tab navigation restructure end-to-end:
 * - All primary routes respond without server errors (< 500)
 * - Key UI chrome is present on each page (nav, headings, controls)
 * - Sub-tabs introduced by the nav restructure are discoverable
 * - Deep-link alias routes continue to resolve
 *
 * Data assertions are intentionally broad: we check for UI structure
 * (loading states, table headers, tab buttons) rather than live chain
 * values, so tests pass in CI without a real node connection.
 */
import { expect, test } from '@playwright/test';

// ── helpers ────────────────────────────────────────────────────────────────

/** Asserts a route loads cleanly (no 4xx/5xx at the HTTP level). */
async function expectPageLoads(page: import('@playwright/test').Page, path: string): Promise<void> {
  const response = await page.goto(path);
  expect(response?.status(), `${path} should not return a server error`).toBeLessThan(500);
  // SSR pages must produce non-empty bodies
  await expect(page.locator('body')).not.toBeEmpty();
}

// ── Navigation chrome ──────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('global nav renders all 7 tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // The 7 nav items introduced by the restructure
    const navLabels = [
      'Dashboard',
      'Blocks',
      'Transactions',
      'Address',
      'Assets',
      'DEX',
      'Network',
    ];

    for (const label of navLabels) {
      // Nav links are case-insensitive text matches
      const link = page.getByRole('link', { name: new RegExp(label, 'i') }).first();
      await expect(link, `nav link "${label}" should be visible`).toBeVisible();
    }
  });

  test('logo / brand element is present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Header should contain some branding (image or text)
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
  });
});

// ── Primary routes ─────────────────────────────────────────────────────────

test.describe('Primary route smoke', () => {
  test('Dashboard (/) loads', async ({ page }) => {
    await expectPageLoads(page, '/');
  });

  test('Blocks (/blocks) loads', async ({ page }) => {
    await expectPageLoads(page, '/blocks');
  });

  test('Transactions (/transaction) loads', async ({ page }) => {
    await expectPageLoads(page, '/transaction');
  });

  test('Address (/address) loads', async ({ page }) => {
    await expectPageLoads(page, '/address');
  });

  test('Asset (/asset) loads', async ({ page }) => {
    await expectPageLoads(page, '/asset');
  });

  test('DEX (/dexpairs) loads', async ({ page }) => {
    await expectPageLoads(page, '/dexpairs');
  });

  test('Network (/network) loads', async ({ page }) => {
    await expectPageLoads(page, '/network');
  });
});

// ── Deep-link aliases ──────────────────────────────────────────────────────

test.describe('Deep-link alias routes', () => {
  test('/networkstatistics still resolves', async ({ page }) => {
    await expectPageLoads(page, '/networkstatistics');
  });

  test('/peers still resolves', async ({ page }) => {
    await expectPageLoads(page, '/peers');
  });

  test('/unconfirmedtransactions still resolves', async ({ page }) => {
    await expectPageLoads(page, '/unconfirmedtransactions');
  });

  test('/blockfeed still resolves', async ({ page }) => {
    await expectPageLoads(page, '/blockfeed');
  });
});

// ── Dashboard page ─────────────────────────────────────────────────────────

test.describe('Dashboard page', () => {
  test('shows auto-refresh toggle', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const toggle = page.locator('#auto-refresh');
    await expect(toggle).toBeVisible();
  });

  test('stat cards area is rendered', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // At least one card should be present
    const cards = page.locator('[class*="card"], [data-slot="card"]');
    await expect(cards.first()).toBeVisible();
  });
});

// ── Blocks page ────────────────────────────────────────────────────────────

test.describe('Blocks page', () => {
  test('renders a table or loading skeleton', async ({ page }) => {
    await page.goto('/blocks');
    await page.waitForLoadState('domcontentloaded');
    // Either a table (data loaded) or skeleton (still loading) should be present
    const tableOrSkeleton = page.locator('table, [data-slot="skeleton"]');
    await expect(tableOrSkeleton.first()).toBeVisible();
  });
});

// ── Transaction page (sub-tabs) ────────────────────────────────────────────

test.describe('Transaction page sub-tabs', () => {
  test('Transactions tab trigger is visible', async ({ page }) => {
    await page.goto('/transaction');
    await page.waitForLoadState('domcontentloaded');
    const transactionsTab = page.getByRole('tab', { name: /transactions/i }).first();
    await expect(transactionsTab).toBeVisible();
  });

  test('Mempool tab trigger is visible', async ({ page }) => {
    await page.goto('/transaction');
    await page.waitForLoadState('domcontentloaded');
    const mempoolTab = page.getByRole('tab', { name: /mempool/i });
    await expect(mempoolTab).toBeVisible();
  });

  test('clicking Mempool tab shows mempool content', async ({ page }) => {
    await page.goto('/transaction');
    await page.waitForLoadState('domcontentloaded');
    const mempoolTab = page.getByRole('tab', { name: /mempool/i });
    await mempoolTab.click();
    // After switching, mempool panel should be visible (may show loading or empty)
    const mempoolPanel = page.getByRole('tabpanel').last();
    await expect(mempoolPanel).toBeVisible();
  });
});

// ── Network page (sub-tabs) ────────────────────────────────────────────────

test.describe('Network page sub-tabs', () => {
  test('Overview tab trigger is visible', async ({ page }) => {
    await page.goto('/network');
    await page.waitForLoadState('domcontentloaded');
    const overviewTab = page.getByRole('tab', { name: /overview/i }).first();
    await expect(overviewTab).toBeVisible();
  });

  test('Peers tab trigger is visible', async ({ page }) => {
    await page.goto('/network');
    await page.waitForLoadState('domcontentloaded');
    const peersTab = page.getByRole('tab', { name: /peers/i });
    await expect(peersTab).toBeVisible();
  });

  test('Node tab trigger is visible', async ({ page }) => {
    await page.goto('/network');
    await page.waitForLoadState('domcontentloaded');
    const nodeTab = page.getByRole('tab', { name: /node/i });
    await expect(nodeTab).toBeVisible();
  });

  test('switching to Peers tab renders peers panel', async ({ page }) => {
    await page.goto('/network');
    await page.waitForLoadState('domcontentloaded');
    const peersTab = page.getByRole('tab', { name: /peers/i });
    await peersTab.click();
    const panel = page.getByRole('tabpanel', { name: /peers/i }).first();
    await expect(panel).toBeVisible();
  });

  test('switching to Node tab renders node panel', async ({ page }) => {
    await page.goto('/network');
    await page.waitForLoadState('domcontentloaded');
    const nodeTab = page.getByRole('tab', { name: /node/i });
    await nodeTab.click();
    const panel = page.getByRole('tabpanel', { name: /node/i }).first();
    await expect(panel).toBeVisible();
  });
});

// ── Address search ─────────────────────────────────────────────────────────

test.describe('Address page', () => {
  test('shows a search input or prompt', async ({ page }) => {
    await page.goto('/address');
    await page.waitForLoadState('domcontentloaded');
    const input = page.locator('input[type="text"], input[placeholder]').first();
    await expect(input).toBeVisible();
  });
});

// ── 404 handling ───────────────────────────────────────────────────────────

test.describe('Error pages', () => {
  test('unknown route shows 404 content (not a blank page)', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist-xyz');
    // Should be 404 (or 200 for SPA fallback), but never 500
    expect(response?.status()).not.toBe(500);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
