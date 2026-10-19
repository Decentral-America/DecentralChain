import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load .env from repo root, then package-local .env (package-local wins).
// quiet: true suppresses the stdout log added in dotenv v17 ("injected env (N) from .env").
config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
config({ path: resolve(process.cwd(), '.env'), quiet: true });

/**
 * The suite runs against a live network. Every default points at the public DecentralChain
 * testnet — the same endpoints admin-e2e uses. To target another network, override all of
 * DCC_TEST_NODE_URL, DCC_TEST_CHAIN_ID, DCC_TEST_DS_URL, DCC_TEST_MATCHER_URL and DCC_TEST_WS_URL.
 */

/** Node REST URL without trailing slash */
export const NODE_URL = process.env.DCC_TEST_NODE_URL ?? 'https://testnet-node.decentralchain.io';

/** Chain ID character ('!' = testnet) */
export const CHAIN_ID = process.env.DCC_TEST_CHAIN_ID ?? '!';

const masterSeed = process.env.DCC_TEST_MINER_SEED;
if (!masterSeed) {
  throw new Error(
    'DCC_TEST_MINER_SEED is not set. The E2E suite needs a funded account on the target network: ' +
      'cp packages/e2e-blockchain/.env.testnet packages/e2e-blockchain/.env (see the package README).',
  );
}
/** Funded account that pays for every test transaction */
export const MASTER_SEED: string = masterSeed;

/** Node REST base URL with trailing slash — used by nodeInteraction helpers */
export const API_BASE = NODE_URL.endsWith('/') ? NODE_URL : `${NODE_URL}/`;

/** Testnet data-service base URL */
export const DS_URL =
  process.env.DCC_TEST_DS_URL ?? 'https://testnet-data-service.decentralchain.io';

/** Matcher (DEX) REST URL without trailing slash */
export const MATCHER_URL =
  process.env.DCC_TEST_MATCHER_URL ?? 'https://testnet-matcher.decentralchain.io';

/** websocket-api URL (topic subscriptions). */
export const WS_URL = process.env.DCC_TEST_WS_URL ?? 'wss://testnet-ws.decentralchain.io/ws';

/**
 * Blockchain-updates gRPC endpoint, e.g. http://127.0.0.1:6881 through an SSH tunnel. The public
 * testnet exposes no gRPC (the node binds 6881 to 127.0.0.1; AUD-087), so the gRPC tests are
 * reported as skipped when this is empty.
 */
export const GRPC_UPDATES_URL = process.env.DCC_TEST_GRPC_UPDATES_URL ?? '';

/**
 * Matcher REST API key, used only to delete the per-run test order book after
 * the exchange suite. Optional: when unset, cleanup is skipped and the
 * exchange UI hides `E2ETestTkn` markets via its network config.
 */
export const MATCHER_API_KEY = process.env.DCC_TEST_MATCHER_API_KEY ?? '';

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
