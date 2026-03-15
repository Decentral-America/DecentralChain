/**
 * TypeScript interfaces for mainnet.json configuration
 * These types ensure type safety across the entire DCC Wallet application
 * and match the exact structure of /configs/mainnet.json
 */

/**
 * Represents a trading pair on the DEX
 * Format: [amountAsset, priceAsset] where each can be either asset ID or "DCC" for native token
 */
export type TradingPair = [string, string];

/**
 * Oracle configuration for external data providers
 */
export interface OracleConfig {
  /** DCC oracle address for price feeds and data services */
  dcc: string;
  /** Tokenomica oracle address (optional, may be empty) */
  tokenomica: string;
}

/**
 * Gateway asset configuration for crypto deposit/withdrawal
 * Used for BTC, ETH, USDT and other gateway-supported assets
 */
export interface GatewayAssetConfig {
  /** Gateway service URL for deposit/withdrawal operations */
  url: string;
  /** Whether this is a third-party gateway (affects UI disclaimers) */
  isThirdParty: boolean;
  /** Regex pattern for validating deposit addresses for this asset */
  regex: string;
  /** Gateway type identifier for provider lookup */
  gateway_type?: string;
  /** Gateway ID for provider lookup */
  gateway_id?: string;
}

/**
 * Matcher priority list entry for DEX trading
 * Defines the order of assets in trading pair selection
 */
export interface MatcherPriorityItem {
  /** Asset ticker symbol (e.g., "DCC", "BTC", "CRC") */
  ticker: string;
  /** Asset ID on blockchain (or "DCC" for native token) */
  id: string;
}

/**
 * Complete mainnet configuration structure
 * This is the single source of truth for all network-specific settings
 */
export interface MainnetConfig {
  /** Trading pairs available on the DEX - format: [[amount, price], ...] */
  tradingPairs: TradingPair[];

  /** Oracle addresses for external data providers */
  oracles: OracleConfig;

  /** API version identifier */
  apiVersion: string;

  /** Network code identifier */
  code: string;

  /** Primary blockchain node URL for transaction broadcast and queries */
  node: string;

  /** DEX matcher service URL for order matching */
  matcher: string;

  /** Data service API URL for account data, transactions, etc. */
  api: string;

  /** Blockchain explorer URL for viewing transactions and addresses */
  explorer: string;

  /** Coinomat gateway URL (deprecated, may be empty) */
  coinomat: string;

  /** Gateway configurations mapped by asset ID */
  gateway: Record<string, GatewayAssetConfig>;

  /** Support page URL */
  support: string;

  /** Terms and Conditions URL */
  termsAndConditions: string;

  /** Privacy Policy URL */
  privacyPolicy: string;

  /** Network peers list URL */
  nodeList: string;

  /** URL for prominent token names CSV (used for asset naming) */
  tokensNameListUrl: string;

  /** URL for scam asset list CSV (used for spam filtering) */
  scamListUrl: string;

  /** Origin URL for the application */
  origin: string;

  /** Features configuration URL (feature flags, enabled/disabled features) */
  featuresConfigUrl: string;

  /** Fee configuration URL (transaction fee tables) */
  feeConfigUrl: string;

  /** Token rating service URL (optional, may be empty) */
  tokenrating: string;

  /** Well-known asset definitions - maps ticker to asset ID */
  assets: Record<string, string>;

  /** Matcher priority list for DEX trading pair selection */
  matcherPriorityList: MatcherPriorityItem[];
}

/**
 * Type guard to check if an object is a valid MainnetConfig
 */
export function isMainnetConfig(obj: unknown): obj is MainnetConfig {
  if (!obj || typeof obj !== 'object') return false;
  const config = obj as Partial<MainnetConfig>;

  return (
    Array.isArray(config.tradingPairs) &&
    typeof config.oracles === 'object' &&
    typeof config.node === 'string' &&
    typeof config.matcher === 'string' &&
    typeof config.api === 'string'
  );
}
