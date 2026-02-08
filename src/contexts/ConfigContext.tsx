import { createContext, useContext, ReactNode, useState, useCallback, useMemo } from 'react';
import { config } from '@/config';
import type { ConfigContextType, NetworkType } from '@/types/config';

// Import network configurations
import mainnetConfig from '../configs/mainnet.json';
import testnetConfig from '../configs/testnet.json';
import stagenetConfig from '../configs/stagenet.json';

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

/**
 * Network configuration map
 */
const networkConfigs = {
  mainnet: mainnetConfig,
  testnet: testnetConfig,
  stagenet: stagenetConfig,
} as const;

/**
 * ConfigProvider component
 * Provides network configuration from configs/mainnet.json merged with environment config
 * Supports dynamic network switching
 */
export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>(
    (config.network as NetworkType) || 'mainnet'
  );

  const networkConfig = networkConfigs[currentNetwork];

  const handleSetNetwork = useCallback((network: NetworkType) => {
    setCurrentNetwork(network);
    // In a real app, you might want to reload the page or update API clients
    console.log(`Network switched to: ${network}`);
  }, []);

  const configValue: ConfigContextType = useMemo(
    () => {
      // Compute networkByte dynamically from current network code
      const networkByte = networkConfig.code.charCodeAt(0);

      return {
        // Environment configuration from src/config
        isDevelopment: config.isDevelopment,
        isProduction: config.isProduction,
        isStaging: config.isStaging,
        enableMocks: config.enableMocks,
        enableDebug: config.enableDebug,

        // Network configuration
        network: currentNetwork,
        networkCode: networkConfig.code,
        networkByte,
        apiVersion: networkConfig.apiVersion,

        // Network switching function
        setNetwork: handleSetNetwork,

        // Service URLs from network config
        apiUrl: networkConfig.api,
        nodeUrl: networkConfig.node,
        matcherUrl: networkConfig.matcher,
        explorerUrl: networkConfig.explorer,
        dataServiceUrl: networkConfig.api,
        coinomatUrl: networkConfig.coinomat || '',

        // Application URLs from network config
        supportUrl: networkConfig.support,
        termsUrl: networkConfig.termsAndConditions,
        privacyUrl: networkConfig.privacyPolicy,
        originUrl: networkConfig.origin,
        nodeListUrl: networkConfig.nodeList,
      featuresConfigUrl: networkConfig.featuresConfigUrl,
      feeConfigUrl: networkConfig.feeConfigUrl,
      tokensNameListUrl: networkConfig.tokensNameListUrl,
      scamListUrl: networkConfig.scamListUrl,
      tokenRatingUrl: networkConfig.tokenrating || '',

      // Assets from network config
      assets: networkConfig.assets || {},

      // Trading pairs from network config
      tradingPairs: (networkConfig.tradingPairs || []) as [string, string][],

      // Matcher priority list from network config
      matcherPriorityList: networkConfig.matcherPriorityList || [],

      // Waves Gateway configuration from network config
      wavesGateway: networkConfig.wavesGateway || {},

      // Oracle addresses from network config
      oracles: networkConfig.oracles,
      };
    },
    [currentNetwork, networkConfig, handleSetNetwork]
  );

  return <ConfigContext.Provider value={configValue}>{children}</ConfigContext.Provider>;
};

/**
 * useConfig hook
 * Access network configuration throughout the application
 * @throws {Error} If used outside ConfigProvider
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};
