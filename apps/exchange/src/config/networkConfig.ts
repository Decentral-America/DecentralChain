/**
 * NetworkConfig Service
 *
 * Build-time network-aware configuration singleton. Reads from the correct
 * per-network JSON (mainnet/testnet/stagenet) based on the VITE_NETWORK env var,
 * which is statically replaced by Vite at build time. Dead branches are tree-shaken.
 *
 * All accessors are read-only. Use this for non-React code (token filters, data-service
 * init, etc.). React components should use ConfigContext for runtime network switching.
 */

import mainnetConfigJson from '../configs/mainnet.json';
import stagenetConfigJson from '../configs/stagenet.json';
import testnetConfigJson from '../configs/testnet.json';
import {
  type GatewayAssetConfig,
  type MainnetConfig,
  type MatcherPriorityItem,
  type OracleConfig,
  type TradingPair,
} from './types';

// Select config at build time from VITE_NETWORK (statically replaced by Vite).
// Testnet and stagenet have a subset of mainnet fields — cast gateway to the
// typed map shape since those networks use a placeholder string URL at build time.
const VITE_NETWORK = import.meta.env.VITE_NETWORK ?? 'mainnet';

const rawJson =
  VITE_NETWORK === 'testnet'
    ? testnetConfigJson
    : VITE_NETWORK === 'stagenet'
      ? stagenetConfigJson
      : mainnetConfigJson;

const _config = {
  ...rawJson,
  assets: rawJson.assets as Record<string, string>,
  // gateway is a full map on mainnet, a string URL on testnet/stagenet.
  // Cast to the typed shape — gateway lookups return undefined on non-mainnet builds.
  gateway: (typeof rawJson.gateway === 'object' && rawJson.gateway !== null
    ? rawJson.gateway
    : {}) as Record<string, GatewayAssetConfig>,
  tradingPairs: (rawJson.tradingPairs as readonly unknown[]).filter(
    (p): p is TradingPair =>
      Array.isArray(p) && p.length === 2 && typeof p[0] === 'string' && typeof p[1] === 'string',
  ),
} satisfies MainnetConfig;

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

  get support(): string {
    return _config.support;
  },

  get termsAndConditions(): string {
    return _config.termsAndConditions;
  },
};

export { NetworkConfig };
