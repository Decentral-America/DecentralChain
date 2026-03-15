import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { config } from '@/config';
import { logger } from '@/lib/logger';
import { type ConfigContextType, type NetworkType } from '@/types/config';

// Import network configurations
import mainnetConfig from '../configs/mainnet.json';
import stagenetConfig from '../configs/stagenet.json';
import testnetConfig from '../configs/testnet.json';

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

/**
 * Network configuration map
 */
const networkConfigs = {
  mainnet: mainnetConfig,
  stagenet: stagenetConfig,
  testnet: testnetConfig,
} as const;

/**
 * ConfigProvider component
 * Provides network configuration from configs/mainnet.json merged with environment config
 * Supports dynamic network switching
 */
export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>(
    (config.network as NetworkType) || 'mainnet',
  );

  const networkConfig = networkConfigs[currentNetwork];

  const handleSetNetwork = useCallback((network: NetworkType) => {
    setCurrentNetwork(network);
    // In a real app, you might want to reload the page or update API clients
    logger.debug(`Network switched to: ${network}`);
  }, []);

  const configValue: ConfigContextType = useMemo(() => {
    // Compute networkByte dynamically from current network code
    const networkByte = networkConfig.code.charCodeAt(0);

    return {
      // Service URLs from network config
      apiUrl: networkConfig.api,
      apiVersion: networkConfig.apiVersion,

      // Assets from network config
      assets: networkConfig.assets || {},
      coinomatUrl: networkConfig.coinomat || '',
      dataServiceUrl: networkConfig.api,
      enableDebug: config.enableDebug,
      enableMocks: config.enableMocks,
      explorerUrl: networkConfig.explorer,
      featuresConfigUrl: networkConfig.featuresConfigUrl,
      feeConfigUrl: networkConfig.feeConfigUrl,

      // DCC Gateway configuration from network config
      gateway: networkConfig.gateway || {},
      // Environment configuration from src/config
      isDevelopment: config.isDevelopment,
      isProduction: config.isProduction,
      isStaging: config.isStaging,

      // Matcher priority list from network config
      matcherPriorityList: networkConfig.matcherPriorityList || [],
      matcherUrl: networkConfig.matcher,

      // Network configuration
      network: currentNetwork,
      networkByte,
      networkCode: networkConfig.code,
      nodeListUrl: networkConfig.nodeList,
      nodeUrl: networkConfig.node,

      // Oracle addresses from network config
      oracles: networkConfig.oracles,
      originUrl: networkConfig.origin,
      privacyUrl: networkConfig.privacyPolicy,
      scamListUrl: networkConfig.scamListUrl,

      // Network switching function
      setNetwork: handleSetNetwork,

      // Application URLs from network config
      supportUrl: networkConfig.support,
      termsUrl: networkConfig.termsAndConditions,
      tokenRatingUrl: networkConfig.tokenrating || '',
      tokensNameListUrl: networkConfig.tokensNameListUrl,

      // Trading pairs from network config
      tradingPairs: (networkConfig.tradingPairs || []) as [string, string][],
    };
  }, [currentNetwork, networkConfig, handleSetNetwork]);

  return <ConfigContext.Provider value={configValue}>{children}</ConfigContext.Provider>;
};

/**
 * useConfig hook
 * Access network configuration throughout the application
 * @throws {Error} If used outside ConfigProvider
 */
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};
