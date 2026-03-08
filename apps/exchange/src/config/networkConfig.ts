/**
 * NetworkConfig Service
 *
 * Centralized configuration access service that provides type-safe access to mainnet.json
 * This replaces Angular's window.DCCApp.network global pattern with a clean service interface
 *
 * All accessors are read-only as mainnet.json is immutable runtime configuration
 */

import mainnetConfigJson from '../configs/mainnet.json';
import {
  type GatewayAssetConfig,
  type MainnetConfig,
  type MatcherPriorityItem,
  type OracleConfig,
  type TradingPair,
} from './types';

const _config: MainnetConfig = mainnetConfigJson as unknown as MainnetConfig;

const NetworkConfig = {
  get node(): string {
    return _config.node;
  },

  get matcher(): string {
    return _config.matcher;
  },

  get api(): string {
    return _config.api;
  },

  get apiVersion(): string {
    return _config.apiVersion;
  },

  get explorer(): string {
    return _config.explorer;
  },

  get support(): string {
    return _config.support;
  },

  get termsAndConditions(): string {
    return _config.termsAndConditions;
  },

  get privacyPolicy(): string {
    return _config.privacyPolicy;
  },

  get code(): string {
    return _config.code;
  },

  get nodeList(): string {
    return _config.nodeList;
  },

  get featuresConfigUrl(): string {
    return _config.featuresConfigUrl;
  },

  get feeConfigUrl(): string {
    return _config.feeConfigUrl;
  },

  get origin(): string {
    return _config.origin;
  },

  get oracles(): OracleConfig {
    return _config.oracles;
  },

  get oracleDCC(): string {
    return _config.oracles.dcc;
  },

  get oracleTokenomica(): string {
    return _config.oracles.tokenomica;
  },

  get tokensNameListUrl(): string {
    return _config.tokensNameListUrl;
  },

  get scamListUrl(): string {
    return _config.scamListUrl;
  },

  getAssetId(ticker: string): string | undefined {
    return _config.assets[ticker];
  },

  getAssetTicker(id: string): string | undefined {
    for (const [ticker, assetId] of Object.entries(_config.assets)) {
      if (assetId === id) return ticker;
    }
    return undefined;
  },

  get assets(): Record<string, string> {
    return { ..._config.assets };
  },

  getTradingPairs(): TradingPair[] {
    return [..._config.tradingPairs];
  },

  getMatcherPriorityList(): MatcherPriorityItem[] {
    return [..._config.matcherPriorityList];
  },

  getGatewayConfig(assetId: string): GatewayAssetConfig | undefined {
    return _config.gateway?.[assetId];
  },

  getAllGatewayConfigs(): Record<string, GatewayAssetConfig> {
    return { ..._config.gateway };
  },

  hasGateway(assetId: string): boolean {
    return !!_config.gateway?.[assetId];
  },

  get networkByte(): number {
    return _config.code.charCodeAt(0);
  },

  getFullConfig(): MainnetConfig {
    return { ..._config };
  },

  get(key: string): unknown {
    const keys = key.split('.');
    let value: unknown = _config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return undefined;
      }
    }

    return value;
  },

  isValid(): boolean {
    return !!(_config?.node && _config.matcher && _config.api);
  },
};

export { NetworkConfig };
export default NetworkConfig;
