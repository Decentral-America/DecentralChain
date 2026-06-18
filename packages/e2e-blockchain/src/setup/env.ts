import { resolve } from 'node:path';
import { config } from 'dotenv';

// Load .env from repo root, then package-local .env (package-local wins)
config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

/** Node REST URL without trailing slash, e.g. http://localhost:6869 */
export const NODE_URL = process.env['DCC_TEST_NODE_URL'] ?? 'http://localhost:6869';

/** Chain ID character, e.g. R */
export const CHAIN_ID = process.env['DCC_TEST_CHAIN_ID'] ?? 'R';

/** Rich-seed account that has DCC tokens on the private node */
export const MASTER_SEED =
  process.env['DCC_TEST_MINER_SEED'] ?? 'dcc private node seed with dcc tokens';

/** Node REST base URL with trailing slash — used by nodeInteraction helpers */
export const API_BASE = NODE_URL.endsWith('/') ? NODE_URL : `${NODE_URL}/`;

/** Testnet data-service base URL */
export const DS_URL =
  process.env['DCC_TEST_DS_URL'] ?? 'https://testnet-data-service.decentralchain.io';
