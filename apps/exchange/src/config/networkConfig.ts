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
  get api(): string {
    return _config.api;
  },

  get apiVersion(): string {
    return _config.apiVersion;
  },

  get assets(): Record<string, string> {
    return { ..._config.assets };
  },

  get code(): string {
    return _config.code;
  },

  get explorer(): string {
    return _config.explorer;
  },

  get featuresConfigUrl(): string {
    return _config.featuresConfigUrl;
  },

  get feeConfigUrl(): string {
    return _config.feeConfigUrl;
  },

  get(key: string): unknown {
    const keys = key.split('.');
    let value: unknown = _config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return;
      }
    }

    return value;
  },

  getAllGatewayConfigs(): Record<string, GatewayAssetConfig> {
    return { ..._config.gateway };
  },

  getAssetId(ticker: string): string | undefined {
    return _config.assets[ticker];
  },

  getAssetTicker(id: string): string | undefined {
    for (const [ticker, assetId] of Object.entries(_config.assets)) {
      if (assetId === id) return ticker;
    }
  },

  getFullConfig(): MainnetConfig {
    return { ..._config };
  },

  getGatewayConfig(assetId: string): GatewayAssetConfig | undefined {
    return _config.gateway?.[assetId];
  },

  getMatcherPriorityList(): MatcherPriorityItem[] {
    return [..._config.matcherPriorityList];
  },

  getTradingPairs(): TradingPair[] {
    return [..._config.tradingPairs];
  },

  hasGateway(assetId: string): boolean {
    return !!_config.gateway?.[assetId];
  },

  isValid(): boolean {
    return !!(_config?.node && _config.matcher && _config.api);
  },

  get matcher(): string {
    return _config.matcher;
  },

  get networkByte(): number {
    return _config.code.charCodeAt(0);
  },
  get node(): string {
    return _config.node;
  },

  get nodeList(): string {
    return _config.nodeList;
  },

  get oracleDCC(): string {
    return _config.oracles.dcc;
  },

  get oracles(): OracleConfig {
    return _config.oracles;
  },

  get oracleTokenomica(): string {
    return _config.oracles.tokenomica;
  },

  get origin(): string {
    return _config.origin;
  },

  get privacyPolicy(): string {
    return _config.privacyPolicy;
  },

  get scamListUrl(): string {
    return _config.scamListUrl;
  },

  get support(): string {
    return _config.support;
  },

  get termsAndConditions(): string {
    return _config.termsAndConditions;
  },

  get tokensNameListUrl(): string {
    return _config.tokensNameListUrl;
  },
};

export { NetworkConfig };
export default NetworkConfig;
