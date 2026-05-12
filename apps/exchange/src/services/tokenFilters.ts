/**
 * Token Filter Service
 *
 * Manages token filtering and naming:
 * 1. Scam list - prevents display of known scam tokens
 * 2. Token names - provides verified names/tickers for assets
 *
 * Data is inlined at build time — no remote fetches, no GitHub CDN dependency.
 * Per-network data is selected via VITE_NETWORK (baked in by Vite at build time).
 * To update: edit the STATIC_* constants below and redeploy.
 */

import { logger } from '@/lib/logger';

export interface TokenInfo {
  assetId: string;
  name: string;
  ticker?: string | undefined;
  verified?: boolean | undefined;
}

// ── Static token data — edit here, not in a remote repo ──────────────────────

const MAINNET_SCAM_LIST: readonly string[] = ['74jKuX6unv6yQcVosoSfKbvmQmi5A4H42crnVWAZ9wh8'];

const MAINNET_TOKEN_NAMES: readonly TokenInfo[] = [
  { assetId: 'DCC', name: 'DecentralCoin', ticker: 'DCC', verified: true },
  {
    assetId: '25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK',
    name: 'Bitcoin',
    ticker: 'BTC',
    verified: true,
  },
  {
    assetId: 'G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo',
    name: 'CR Coin',
    ticker: 'CRC',
    verified: true,
  },
  {
    assetId: 'CCcUGv8eoyoF96c8HHbnbGsPdumr7jPpoRS6orPeg6Wb',
    name: 'DGFTHR',
    ticker: 'DGFTHR',
    verified: true,
  },
];

const TESTNET_SCAM_LIST: readonly string[] = [];
const TESTNET_TOKEN_NAMES: readonly TokenInfo[] = [
  { assetId: 'DCC', name: 'DecentralCoin', ticker: 'DCC', verified: true },
];

const STAGENET_SCAM_LIST: readonly string[] = [];
const STAGENET_TOKEN_NAMES: readonly TokenInfo[] = [
  { assetId: 'DCC', name: 'DecentralCoin', ticker: 'DCC', verified: true },
  {
    assetId: 'yrdwwJJqTKoCt63krHFVZxJvNbUPgHcDeuJXPEGsJCx',
    name: 'Bitcoin',
    ticker: 'BTC',
    verified: true,
  },
  {
    assetId: 'HETgTyfn5grcHWGRKHi7p3hvMB4QxWVrPD8Fnfi9tfD9',
    name: 'USD',
    ticker: 'USD',
    verified: true,
  },
  {
    // biome-ignore lint/security/noSecrets: blockchain asset ID (base58 public key), not a secret
    assetId: 'EqZfxiqYKkByP42hqNsvuPdXxVYMHaQDwfKgFnAz5D1x',
    name: 'EUR',
    ticker: 'EUR',
    verified: true,
  },
];

// Select data set at build time from VITE_NETWORK (statically replaced by Vite).
const VITE_NETWORK = import.meta.env.VITE_NETWORK ?? 'mainnet';
const INITIAL_SCAM_LIST =
  VITE_NETWORK === 'testnet'
    ? TESTNET_SCAM_LIST
    : VITE_NETWORK === 'stagenet'
      ? STAGENET_SCAM_LIST
      : MAINNET_SCAM_LIST;
const INITIAL_TOKEN_NAMES =
  VITE_NETWORK === 'testnet'
    ? TESTNET_TOKEN_NAMES
    : VITE_NETWORK === 'stagenet'
      ? STAGENET_TOKEN_NAMES
      : MAINNET_TOKEN_NAMES;

// ─────────────────────────────────────────────────────────────────────────────

class TokenFilterService {
  private scamList: Set<string>;
  private tokenNames: Map<string, TokenInfo>;
  private initialized = false;

  constructor() {
    this.scamList = new Set(INITIAL_SCAM_LIST);
    this.tokenNames = new Map(INITIAL_TOKEN_NAMES.map((t) => [t.assetId, t]));
    this.initialized = true;
    logger.debug('[TokenFilter] Initialized from static data:', {
      namedTokens: this.tokenNames.size,
      network: VITE_NETWORK,
      scamTokens: this.scamList.size,
    });
  }

  /**
   * No-op — kept for API compatibility. Data is loaded synchronously in constructor.
   */
  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Check if an asset is on the scam list
   * @param assetId - Asset ID to check
   * @returns true if asset is a known scam
   */
  isScam(assetId: string): boolean {
    if (!assetId) return false;
    return this.scamList.has(assetId);
  }

  /**
   * Get detailed token information
   * @param assetId - Asset ID to look up
   * @returns Token info if available
   */
  getTokenInfo(assetId: string): TokenInfo | undefined {
    if (!assetId) return;
    return this.tokenNames.get(assetId);
  }

  /**
   * Get display name for a token, with fallback
   * @param assetId - Asset ID to look up
   * @param fallback - Fallback name if not found
   * @returns Token ticker, name, or fallback
   */
  getDisplayName(assetId: string, fallback: string = 'Unknown'): string {
    if (!assetId) return fallback;
    const info = this.getTokenInfo(assetId);
    if (!info) return fallback;
    // biome-ignore lint/nursery/useNullishCoalescing: ticker/name may be '' (empty = no display name) — || fallback chain is intentional
    return info.ticker || info.name || fallback;
  }

  /**
   * Get all verified tokens
   * @returns Array of verified token info
   */
  getVerifiedTokens(): TokenInfo[] {
    return Array.from(this.tokenNames.values()).filter((token) => token.verified);
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
const tokenFilterService = new TokenFilterService();
export default tokenFilterService;
