import { type SignerOptions } from './types/index.js';

/** Public DecentralChain mainnet node (chain id '?'). */
export const MAINNET_NODE_URL = 'https://mainnet-node.decentralchain.io';

/** Public DecentralChain testnet node (chain id '!'). */
export const TESTNET_NODE_URL = 'https://testnet-node.decentralchain.io';

export const DEFAULT_OPTIONS: SignerOptions = {
  LOG_LEVEL: 'production',
  NODE_URL: MAINNET_NODE_URL,
};
