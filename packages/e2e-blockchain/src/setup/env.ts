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
