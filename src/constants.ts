import { type SignerOptions } from './types/index.js';

export const DEFAULT_OPTIONS: SignerOptions = {
  NODE_URL: 'https://nodes.decentralchain.io',
  LOG_LEVEL: 'production',
};

export const DEFAULT_BROADCAST_OPTIONS = {
  chain: false,
  confirmations: 0,
} as const;

export const MAX_ALIAS_LENGTH = 30;

export const SMART_ASSET_EXTRA_FEE = 400_000;
