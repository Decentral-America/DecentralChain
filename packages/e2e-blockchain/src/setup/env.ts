import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load .env from repo root, then package-local .env (package-local wins).
// quiet: true suppresses the stdout log added in dotenv v17 ("injected env (N) from .env").
config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
config({ path: resolve(process.cwd(), '.env'), quiet: true });

/** Node REST URL without trailing slash, e.g. http://localhost:6869 */
export const NODE_URL = process.env.DCC_TEST_NODE_URL ?? 'http://localhost:6869';

/** Chain ID character, e.g. R */
export const CHAIN_ID = process.env.DCC_TEST_CHAIN_ID ?? 'R';

/** Rich-seed account that has DCC tokens on the private node */
export const MASTER_SEED =
  process.env.DCC_TEST_MINER_SEED ?? 'dcc private node seed with dcc tokens';

/** Node REST base URL with trailing slash — used by nodeInteraction helpers */
export const API_BASE = NODE_URL.endsWith('/') ? NODE_URL : `${NODE_URL}/`;

/** Testnet data-service base URL */
export const DS_URL =
  process.env.DCC_TEST_DS_URL ?? 'https://testnet-data-service.decentralchain.io';

/** Matcher (DEX) REST URL without trailing slash */
export const MATCHER_URL =
  process.env.DCC_TEST_MATCHER_URL ?? 'https://testnet-matcher.decentralchain.io';

/** Node REST API key — enables /peers/connected, /transactions/sign, /debug/* */
export const API_KEY = process.env.DCC_TEST_API_KEY ?? process.env.DCC_API_KEY ?? '';

/** Node wallet address (for /transactions/sign — node signs with its own key) */
export const NODE_ADDRESS = process.env.DCC_TEST_NODE_ADDRESS ?? process.env.DCC_NODE_ADDRESS ?? '';

/**
 * Caddy's rate limiter (infra/.github/workflows/update-caddy.yml) throttles
 * /transactions/broadcast to 50/min per IP. Running ~20+ spec files
 * concurrently, each funding its own test accounts via one broadcast apiece,
 * legitimately exceeds that on its own. DCC_TEST_E2E_BYPASS_KEY (set only in
 * admin-e2e.yml from the E2E_RATE_LIMIT_BYPASS_KEY secret) lets our own CI
 * traffic skip rate limiting via a secret header Caddy checks for an exact
 * match -- anyone without the real secret value still gets fully rate
 * limited. Scoped to *.decentralchain.io only, and monkey-patches global
 * fetch here (the test suite's own setup file) rather than any published SDK
 * package, so this has zero effect on real dApp developers using those SDKs.
 */
const E2E_BYPASS_KEY = process.env.DCC_TEST_E2E_BYPASS_KEY;
if (E2E_BYPASS_KEY) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (/^https?:\/\/([a-z0-9-]+\.)?decentralchain\.io\//i.test(url)) {
      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined),
      );
      headers.set('X-E2E-Bypass', E2E_BYPASS_KEY);
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch(input, init);
  }) as typeof fetch;
}
