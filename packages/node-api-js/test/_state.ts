/**
 * Test state configuration.
 *
 * For unit tests, these values are not used.
 * For integration tests, set the DCC_NODE_URL environment variable
 * to point to a running DecentralChain node.
 *
 * Example:
 *   DCC_NODE_URL=https://nodes.decentralchain.io npm run test:integration
 */

export const NODE_URL = process.env.DCC_NODE_URL ?? 'https://nodes.decentralchain.io';
export const CHAIN_ID = process.env.DCC_CHAIN_ID ?? 'D';
export const NETWORK_BYTE = CHAIN_ID.charCodeAt(0);

export const MASTER_ACCOUNT = {
  SEED: process.env.DCC_MASTER_SEED ?? '',
  ADDRESS: process.env.DCC_MASTER_ADDRESS ?? '',
};

/** Base64-encoded DApp script used in compile/decompile tests */
export const DAP_SCRIPT = process.env.DCC_DAP_SCRIPT ?? '';

export const STATE = {
  ACCOUNTS: {
    SIMPLE: {
      seed: process.env.DCC_SIMPLE_SEED ?? '',
      address: process.env.DCC_SIMPLE_ADDRESS ?? '',
      publicKey: process.env.DCC_SIMPLE_PUBLIC_KEY ?? '',
      alias: process.env.DCC_SIMPLE_ALIAS ?? '',
      data: {
        key: {
          type: 'string' as const,
          value: 'test',
        },
      },
    },
    SMART: {
      seed: process.env.DCC_SMART_SEED ?? '',
      address: process.env.DCC_SMART_ADDRESS ?? '',
      alias: process.env.DCC_SMART_ALIAS ?? '',
    },
    FOR_SCRIPT: {
      address: process.env.DCC_FOR_SCRIPT_ADDRESS ?? '',
    },
  },
  ASSETS: {
    BTC: {
      id: process.env.DCC_BTC_ASSET_ID ?? '',
    },
    ETH: {
      id: process.env.DCC_ETH_ASSET_ID ?? '',
    },
    SMART: {
      id: process.env.DCC_SMART_ASSET_ID ?? '',
    },
  },
};
