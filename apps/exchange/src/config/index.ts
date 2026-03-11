/**
 * Application Configuration
 * Centralizes all environment-specific configuration with type safety
 * Now derives all network values from mainnet.json via NetworkConfig service
 */

import { logger } from '@/lib/logger';
import NetworkConfig from './networkConfig';

export interface Config {
  // Environment flags
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  enableMocks: boolean;
  enableDebug: boolean;

  // Network configuration (derived from mainnet.json via NetworkConfig)
  network: string;
  networkByte: number;
  apiUrl: string;
  wsUrl?: string | undefined;
  nodeUrl: string;
  matcherUrl: string;
  explorerUrl: string;
  dataServiceUrl: string;

  // Application URLs (from mainnet.json)
  supportUrl: string;
  termsUrl: string;
  privacyUrl: string;
  originUrl: string;

  // Feature flags
  sentryEnabled: boolean;
  sentryDsn?: string | undefined;
}

/**
 * Get application configuration
 * All network values default to mainnet.json via NetworkConfig
 * Environment variables can override for testing/staging
 */
const getConfig = (): Config => {
  const env = import.meta.env.VITE_APP_ENV || 'development';

  return {
    // Environment flags
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    isStaging: env === 'staging',
    enableMocks: import.meta.env.VITE_ENABLE_MOCKS === 'true',
    enableDebug: import.meta.env.VITE_DEBUG === 'true',

    // Network configuration - defaults from NetworkConfig (mainnet.json)
    network: import.meta.env.VITE_NETWORK || 'mainnet',
    networkByte: NetworkConfig.networkByte,
    apiUrl: import.meta.env.VITE_API_URL || NetworkConfig.api,
    nodeUrl: import.meta.env.VITE_NODE_URL || NetworkConfig.node,
    matcherUrl: import.meta.env.VITE_MATCHER_URL || NetworkConfig.matcher,
    explorerUrl: import.meta.env.VITE_EXPLORER_URL || NetworkConfig.explorer,
    dataServiceUrl: import.meta.env.VITE_DATA_SERVICE_URL || NetworkConfig.api,

    // Application URLs - from mainnet.json via NetworkConfig
    supportUrl: NetworkConfig.support,
    termsUrl: NetworkConfig.termsAndConditions,
    privacyUrl: NetworkConfig.privacyPolicy,
    originUrl: NetworkConfig.origin,

    // Feature flags
    sentryEnabled: import.meta.env.VITE_SENTRY_ENABLED === 'true',
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  };
};

/**
 * Application configuration instance
 * Import and use this throughout the application
 */
export const config = getConfig();

/**
 * Helper to check if running in development mode
 */
export const isDev = config.isDevelopment;

/**
 * Helper to check if running in production mode
 */
export const isProd = config.isProduction;

/**
 * Re-export NetworkConfig for direct access to extended configuration
 * Use this for: trading pairs, gateway configs, token filters, asset mappings, etc.
 */
export { NetworkConfig };

/**
 * Helper to log only in development
 */
export const devLog = (...args: unknown[]): void => {
  if (config.enableDebug || config.isDevelopment) {
    logger.debug('[DEV]', ...args);
  }
};
