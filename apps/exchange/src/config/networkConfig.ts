/**
 * NetworkConfig Service
 *
 * Centralized configuration access service that provides type-safe access to mainnet.json
 * This replaces Angular's window.WavesApp.network global pattern with a clean service interface
 *
 * All methods are static to avoid unnecessary instantiation
 * All accessors are read-only as mainnet.json is immutable runtime configuration
 */

import mainnetConfigJson from '../configs/mainnet.json';
import type {
  MainnetConfig,
  TradingPair,
  GatewayAssetConfig,
  MatcherPriorityItem,
  OracleConfig,
} from './types';

export class NetworkConfig {
  private static config: MainnetConfig = mainnetConfigJson as unknown as MainnetConfig;

  /**
   * Primary blockchain node URL for transaction broadcast and queries
   * Example: "https://mainnet-node.decentralchain.io"
   */
  static get node(): string {
    return this.config.node;
  }

  /**
   * DEX matcher service URL for order matching
   * Example: "https://mainnet-matcher.decentralchain.io/matcher"
   */
  static get matcher(): string {
    return this.config.matcher;
  }

  /**
   * Data service API URL for account data, transactions, balances
   * Example: "https://data-service.decentralchain.io"
   */
  static get api(): string {
    return this.config.api;
  }

  /**
   * API version identifier
   * Example: "v0"
   */
  static get apiVersion(): string {
    return this.config.apiVersion;
  }

  /**
   * Blockchain explorer URL for viewing transactions and addresses
   * Example: "https://decentralscan.com"
   */
  static get explorer(): string {
    return this.config.explorer;
  }

  /**
   * Support page URL
   * Example: "https://decentralchain.io/soporte"
   */
  static get support(): string {
    return this.config.support;
  }

  /**
   * Terms and Conditions URL
   */
  static get termsAndConditions(): string {
    return this.config.termsAndConditions;
  }

  /**
   * Privacy Policy URL
   */
  static get privacyPolicy(): string {
    return this.config.privacyPolicy;
  }

  /**
   * Network code identifier
   * Example: "?" for mainnet
   */
  static get code(): string {
    return this.config.code;
  }

  /**
   * Network peers list URL
   * Example: "https://decentralscan.com/peers"
   */
  static get nodeList(): string {
    return this.config.nodeList;
  }

  /**
   * Features configuration URL (feature flags)
   * Example: "https://raw.githubusercontent.com/.../config.json"
   */
  static get featuresConfigUrl(): string {
    return this.config.featuresConfigUrl;
  }

  /**
   * Fee configuration URL (transaction fee tables)
   * Example: "https://raw.githubusercontent.com/.../fee.json"
   */
  static get feeConfigUrl(): string {
    return this.config.feeConfigUrl;
  }

  /**
   * Application origin URL
   * Example: "https://decentral.exchange"
   */
  static get origin(): string {
    return this.config.origin;
  }

  // ========== Oracle Configuration ==========

  /**
   * Get complete oracle configuration object
   */
  static get oracles(): OracleConfig {
    return this.config.oracles;
  }

  /**
   * Waves oracle address for price feeds and data services
   * Example: "3DUM611HQFwQcCQDQnA5W92Xs219smEHaaP"
   */
  static get oracleWaves(): string {
    return this.config.oracles.waves;
  }

  /**
   * Tokenomica oracle address (may be empty)
   */
  static get oracleTokenomica(): string {
    return this.config.oracles.tokenomica;
  }

  // ========== Token/Asset Configuration ==========

  /**
   * URL for prominent token names CSV (used for asset naming)
   * Example: "https://raw.githubusercontent.com/.../token-name-list.csv"
   */
  static get tokensNameListUrl(): string {
    return this.config.tokensNameListUrl;
  }

  /**
   * URL for scam asset list CSV (used for spam filtering)
   * Example: "https://raw.githubusercontent.com/.../scam-v1.csv"
   */
  static get scamListUrl(): string {
    return this.config.scamListUrl;
  }

  /**
   * Get well-known asset ID by ticker name
   * @param ticker - Asset ticker (e.g., "BTC", "DCC", "CRC")
   * @returns Asset ID or undefined if not found
   */
  static getAssetId(ticker: string): string | undefined {
    return this.config.assets[ticker];
  }

  /**
   * Get asset ticker by ID
   * @param id - Asset ID
   * @returns Ticker name or undefined if not found
   */
  static getAssetTicker(id: string): string | undefined {
    // Reverse lookup in assets map
    for (const [ticker, assetId] of Object.entries(this.config.assets)) {
      if (assetId === id) return ticker;
    }
    return undefined;
  }

  /**
   * Get all well-known assets as a map
   * @returns Record of ticker -> asset ID
   */
  static get assets(): Record<string, string> {
    return { ...this.config.assets }; // Return copy to prevent mutation
  }

  // ========== Trading Pairs (DEX) ==========

  /**
   * Get all trading pairs available on the DEX
   * Format: [[amountAsset, priceAsset], ...]
   * @returns Array of trading pairs
   */
  static getTradingPairs(): TradingPair[] {
    return [...this.config.tradingPairs]; // Return copy to prevent mutation
  }

  /**
   * Get matcher priority list for DEX trading
   * Defines the order of assets in trading pair selection
   * @returns Array of {ticker, id} objects
   */
  static getMatcherPriorityList(): MatcherPriorityItem[] {
    return [...this.config.matcherPriorityList]; // Return copy
  }

  // ========== Gateway Configuration ==========

  /**
   * Get gateway configuration for a specific asset
   * Used for BTC, ETH, USDT deposits and withdrawals
   * @param assetId - Asset ID to get gateway config for
   * @returns Gateway config or undefined if not found
   */
  static getGatewayConfig(assetId: string): GatewayAssetConfig | undefined {
    return this.config.wavesGateway?.[assetId];
  }

  /**
   * Get all gateway configurations
   * @returns Record of asset ID -> gateway config
   */
  static getAllGatewayConfigs(): Record<string, GatewayAssetConfig> {
    return { ...this.config.wavesGateway }; // Return copy
  }

  /**
   * Check if an asset has gateway support
   * @param assetId - Asset ID to check
   * @returns true if gateway exists for this asset
   */
  static hasGateway(assetId: string): boolean {
    return !!this.config.wavesGateway?.[assetId];
  }

  // ========== Network-Specific Utilities ==========

  /**
   * Get network byte for seed/address generation
   * DCC Mainnet: 87 (character code of '?')
   * @returns Network byte value
   */
  static get networkByte(): number {
    return this.config.code.charCodeAt(0);
  }

  /**
   * Get complete configuration object
   * Useful for data-service initialization: ds.config.setConfig(NetworkConfig.getFullConfig())
   * @returns Complete MainnetConfig object
   */
  static getFullConfig(): MainnetConfig {
    return { ...this.config }; // Return deep copy
  }

  /**
   * Get specific configuration value by key path
   * Useful for dynamic config access
   * @param key - Dot-notation path (e.g., "oracles.waves")
   * @returns Configuration value or undefined
   */
  static get(key: string): unknown {
    const keys = key.split('.');
    let value: unknown = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Check if configuration is loaded and valid
   * @returns true if config is valid
   */
  static isValid(): boolean {
    return !!(this.config && this.config.node && this.config.matcher && this.config.api);
  }
}

// Default export for convenience
export default NetworkConfig;
