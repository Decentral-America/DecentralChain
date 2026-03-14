/**
 * Configuration context types
 */

/**
 * Asset mapping interface for blockchain assets
 */
export interface Asset {
  ticker: string;
  id: string;
}

/**
 * Waves Gateway configuration for external blockchain integrations
 */
export interface WavesGatewayConfig {
  url: string;
  isThirdParty: boolean;
  regex: string;
}

/**
 * Oracle addresses for price feeds and data
 */
export interface Oracles {
  waves: string;
  tokenomica: string;
}

/**
 * Network type
 */
export type NetworkType = 'mainnet' | 'testnet' | 'stagenet';

/**
 * Configuration context type providing network and application settings
 */
export interface ConfigContextType {
  // Environment configuration
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  enableMocks: boolean;
  enableDebug: boolean;

  // Network configuration
  network: NetworkType;
  networkCode: string;
  networkByte: number;
  apiVersion: string;

  // Network switching
  setNetwork: (network: NetworkType) => void;

  // Service URLs
  apiUrl: string;
  nodeUrl: string;
  matcherUrl: string;
  explorerUrl: string;
  dataServiceUrl: string;
  coinomatUrl: string;

  // Application URLs
  supportUrl: string;
  termsUrl: string;
  privacyUrl: string;
  originUrl: string;
  nodeListUrl: string;
  featuresConfigUrl: string;
  feeConfigUrl: string;
  tokensNameListUrl: string;
  scamListUrl: string;
  tokenRatingUrl: string;

  // Assets and trading
  assets: Record<string, string>;
  tradingPairs: [string, string][];
  matcherPriorityList: Asset[];

  // Gateway and oracle configuration
  wavesGateway: Record<string, WavesGatewayConfig>;
  oracles: Oracles;
}
