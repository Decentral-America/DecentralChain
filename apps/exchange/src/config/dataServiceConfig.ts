/**
 * Data Service Configuration Initializer
 * Matches Angular's AppConfig.js initialization
 * Must be called before using any data-service features
 */
import * as ds from 'data-service';
import NetworkConfig from './networkConfig';

/**
 * Initialize data-service with complete network configuration
 * Matches Angular: ds.config.setConfig(WavesApp.network)
 *
 * Note: data-service's IConfigParams interface only accepts specific fields.
 * Other config values (tradingPairs, wavesGateway, etc.) are accessed via NetworkConfig service.
 */
export function initializeDataService(): void {
  // Get complete config from NetworkConfig service
  const fullConfig = NetworkConfig.getFullConfig();

  console.log('[DataService] Initializing with complete mainnet config:', {
    node: fullConfig.node,
    api: fullConfig.api,
    matcher: fullConfig.matcher,
    oracleWaves: fullConfig.oracles.waves,
    assets: Object.keys(fullConfig.assets).length,
  });

  // Pass configuration fields that data-service's IConfigParams interface accepts
  // Extended fields (tradingPairs, wavesGateway, etc.) accessed via NetworkConfig
  ds.config.setConfig({
    // Core API endpoints
    code: fullConfig.code,
    node: fullConfig.node,
    matcher: fullConfig.matcher,
    api: fullConfig.api,
    apiVersion: fullConfig.apiVersion,

    // Oracles for data providers
    oracleWaves: fullConfig.oracles.waves,
    oracleTokenomica: fullConfig.oracles.tokenomica || '',

    // Asset mappings
    assets: fullConfig.assets,

    // Support URLs
    support: fullConfig.support,
    nodeList: fullConfig.nodeList,

    // Legacy/optional fields
    coinomat: fullConfig.coinomat || '',
    tokenrating: fullConfig.tokenrating || '',

    // Additional fields for Angular compatibility
    minimalSeedLength: 15,
    remappedAssetNames: {},
    rewriteAssets: {},
  });

  console.log(
    '[DataService] Initialized successfully - Extended config available via NetworkConfig'
  );

  // Note: Components should use NetworkConfig service for extended features:
  // - NetworkConfig.getTradingPairs() for DEX pairs
  // - NetworkConfig.getGatewayConfig(assetId) for crypto gateways
  // - NetworkConfig.scamListUrl / tokensNameListUrl for token filters
  // - NetworkConfig.explorer for blockchain explorer links
  // - NetworkConfig.matcherPriorityList for DEX asset ordering
}

/**
 * Check if data-service is properly initialized
 */
export function isDataServiceReady(): boolean {
  try {
    const dataService = ds.config.getDataService();
    return dataService !== null;
  } catch {
    return false;
  }
}
