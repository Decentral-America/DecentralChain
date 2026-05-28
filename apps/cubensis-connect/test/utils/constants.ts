export const WHITELIST = [
  'swop.fi',
  'vires.finance',
  'app.power.tech',
  'wx.network',
  'decentralchain.io',
];

export const CUSTOMLIST = ['docs.decentralchain.io', 'decentralchain.io'];

export const DEFAULT_PASSWORD = 'default-password';

// ── Test seeds ─────────────────────────────────────────────────────────
// Read from environment so seeds NEVER live in source control.
// Defaults are empty — tests fail fast if env is not configured.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Set it in .env or export it before running tests. ' +
        'See .env.example for the full list.',
    );
  }
  return value;
}

/** Rich genesis account — has DCC tokens on the private test node. */
export const DEFAULT_MINER_SEED = requireEnv('DCC_TEST_MINER_SEED');

/** Account without DCC tokens on the private test node. */
export const POOR_ACCOUNT_SEED = requireEnv('DCC_TEST_POOR_SEED');

/** Issuer account that receives tokens from the generator. */
export const ISSUER_SEED = requireEnv('DCC_TEST_ISSUER_SEED');

/** Test user #1. */
export const USER_1_SEED = requireEnv('DCC_TEST_USER_1_SEED');

/** Test user #2. */
export const USER_2_SEED = requireEnv('DCC_TEST_USER_2_SEED');

/** Extra test account (used for multi-account UI tests). */
export const TEST_ACCOUNT_SEED = requireEnv('DCC_TEST_EXTRA_SEED');

/** Extra test account #2 (used for multi-account UI tests). */
export const TEST_ACCOUNT_3_SEED = requireEnv('DCC_TEST_EXTRA_3_SEED');
