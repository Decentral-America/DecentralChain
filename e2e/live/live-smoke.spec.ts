import { expect, type Page, test } from '@playwright/test';

const EXCHANGE = process.env.LIVE_EXCHANGE_URL ?? 'https://testnet.decentral.exchange';
const SCANNER = process.env.LIVE_SCANNER_URL ?? 'https://testnet.decentralscan.com';
const ADMIN = process.env.LIVE_ADMIN_URL ?? 'https://testnet-admin.decentralchain.io';
const MATCHER = process.env.LIVE_MATCHER_URL ?? 'https://testnet-matcher.decentralchain.io';
const NODE = process.env.LIVE_NODE_URL ?? 'https://testnet-node.decentralchain.io';

/** Mirrors `hiddenMarketAssetNames` in apps/exchange/src/configs/testnet.json. */
const HIDDEN_MARKETS = new Set(['E2ETestTkn', 'DEXPROOF']);

interface Market {
  amountAsset: string;
  amountAssetName: string;
  priceAsset: string;
  priceAssetName: string;
}

/** Browser-side failures the node-level suites cannot see: CORS, CSP, failed fetches, crashes. */
function collectBrowserProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (
      /CORS|Access-Control-Allow-Origin|Content Security Policy|Refused to (connect|load|execute|frame)/i.test(
        text,
      )
    ) {
      problems.push(`console: ${text}`);
    }
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? 'unknown';
    if (failure === 'net::ERR_ABORTED') return;
    if (/decentralchain\.io|decentralscan\.com|decentral\.exchange/.test(request.url())) {
      problems.push(`requestfailed: ${request.url()} (${failure})`);
    }
  });
  return problems;
}

test.describe('exchange', () => {
  test('ships security headers and loads without CORS or CSP errors', async ({ page }) => {
    const problems = collectBrowserProblems(page);
    const response = await page.goto(EXCHANGE, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    const headers = response?.headers() ?? {};
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['strict-transport-security']).toMatch(/max-age=\d{8,}/);
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-robots-tag']).toContain('noindex');
    expect(problems).toEqual([]);
  });

  test('the matcher answers the exchange origin and lists a market with a live order book', async ({
    page,
    request,
  }) => {
    const settings = await request.get(`${MATCHER}/matcher/settings`, {
      headers: { Origin: EXCHANGE },
    });
    expect(settings.status()).toBe(200);
    const allowOrigin = settings
      .headersArray()
      .filter((header) => header.name.toLowerCase() === 'access-control-allow-origin');
    expect(allowOrigin, 'exactly one Access-Control-Allow-Origin header').toHaveLength(1);

    // Fetch from the exchange page itself, so browser CORS and the page's CSP both apply.
    await page.goto(EXCHANGE, { waitUntil: 'domcontentloaded' });
    const markets = await page.evaluate(async (matcher) => {
      const res = await fetch(`${matcher}/matcher/orderbook`);
      return { body: (await res.json()) as { markets?: Market[] }, status: res.status };
    }, MATCHER);
    expect(markets.status).toBe(200);
    const visible = (markets.body.markets ?? []).filter(
      (m) => !HIDDEN_MARKETS.has(m.amountAssetName) && !HIDDEN_MARKETS.has(m.priceAssetName),
    );
    expect(visible.length, 'the matcher lists no market the exchange would show').toBeGreaterThan(
      0,
    );

    const first = visible[0];
    if (!first) throw new Error('no visible market');
    const book = await page.evaluate(
      async ({ amount, matcher, price }) => {
        const res = await fetch(`${matcher}/matcher/orderbook/${amount}/${price}`);
        return {
          body: (await res.json()) as { asks?: unknown; bids?: unknown },
          status: res.status,
        };
      },
      { amount: first.amountAsset, matcher: MATCHER, price: first.priceAsset },
    );
    expect(book.status).toBe(200);
    expect(Array.isArray(book.body.bids) && Array.isArray(book.body.asks)).toBe(true);
  });
});

test.describe('scanner', () => {
  test('dashboard and DEX pairs render live data without browser errors', async ({ page }) => {
    const problems = collectBrowserProblems(page);
    await page.goto(SCANNER, { waitUntil: 'networkidle' });
    await page.goto(`${SCANNER}/dexpairs`, { waitUntil: 'networkidle' });
    await expect(page.getByText('Total Pairs')).toBeVisible();
    await expect(page.getByText('No trading pairs available')).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('the block page shows the node’s block id', async ({ page, request }) => {
    const last = (await (await request.get(`${NODE}/blocks/headers/last`)).json()) as {
      height: number;
      id: string;
    };
    await page.goto(`${SCANNER}/blockdetail?height=${last.height}`, { waitUntil: 'networkidle' });
    await expect(page.getByTestId('block-id')).toHaveText(last.id);
  });

  test('health, robots and sitemap answer with absolute URLs', async ({ request }) => {
    const health = await request.get(`${SCANNER}/api/health`);
    expect(health.status()).toBe(200);
    expect(await health.json()).toMatchObject({ status: 'ok' });
    expect(await (await request.get(`${SCANNER}/robots.txt`)).text()).toContain(
      `Sitemap: ${SCANNER}/sitemap.xml`,
    );
    expect(await (await request.get(`${SCANNER}/sitemap.xml`)).text()).toContain(
      `<loc>${SCANNER}/blocks</loc>`,
    );
  });
});

test.describe('admin dashboard', () => {
  test('health answers and the login page renders cleanly', async ({ page, request }) => {
    expect((await request.get(`${ADMIN}/healthz`)).status()).toBe(200);
    const problems = collectBrowserProblems(page);
    const response = await page.goto(`${ADMIN}/login`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    expect(problems).toEqual([]);
  });
});
