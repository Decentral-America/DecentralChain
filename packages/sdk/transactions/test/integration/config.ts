import { randomBytes } from '@decentralchain/ts-lib-crypto';

/**
 * Before running test ensure MASTER_SEED has at least 10 DCC!!
 * All values are read from environment — see .env.example at repo root.
 */

export const CHAIN_ID = process.env.DCC_TEST_CHAIN_ID ?? 'R';
export const API_BASE = process.env.DCC_TEST_NODE_URL ?? 'http://localhost:6869';

export const MASTER_SEED =
  process.env.DCC_TEST_MINER_SEED || 'dcc private node seed with dcc tokens';

export const MATCHER_PUBLIC_KEY =
  process.env.DCC_TEST_MATCHER_PUBLIC_KEY ?? 'DDMFGjv3rCULuVkFywAHebd9mjKZnoQgqPixsSsReqtY';
export const MATCHER_URL = process.env.DCC_TEST_MATCHER_URL ?? 'http://localhost:6886';

export const TIMEOUT = 60000;

// @ts-expect-error TS2461: randomBytes returns Uint8Array; spread via [...value] is valid
// at runtime but TypeScript's strict iterator inference rejects the spread.
export const randomHexString = (l: number) =>
  [...randomBytes(l)].map((n) => n.toString(16)).join('');
