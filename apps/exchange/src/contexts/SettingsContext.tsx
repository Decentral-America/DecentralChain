/**
 * SettingsContext - Centralized settings state management
 * Matches Angular: DefaultSettings.js
 *
 * Manages both common settings (shared across accounts) and per-user settings
 * with localStorage persistence and change notifications.
 */

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { NetworkConfig } from '../config/networkConfig';
import { useAuth } from './AuthContext';

// Storage keys
const STORAGE_KEYS = {
  COMMON_SETTINGS: 'multiAccountCommonSettings',
  USER_SETTINGS: 'multiAccountUserSettings',
};

/**
 * Common settings (shared across all accounts)
 * Matches Angular commonDefaults
 */
interface CommonSettings {
  lng: string; // Language
  theme: 'default' | 'black';
  advancedMode: boolean;
  lastOpenVersion: string;
  whatsNewList: string[];
  logoutAfterMin: number; // Session timeout in minutes
  termsAccepted: boolean;
  needReadNewTerms: boolean;
  closedNotification: string[];
  withScam: boolean;
  dontShowSpam: boolean;
  tradeWithScriptAssets: boolean;
  baseAssetId: string;
  events: Record<string, unknown>;

  // Network configuration
  network: {
    code: string;
    server: string;
    matcher: string;
    api: string;
    coinomat: string;
    nodeList: string;
    dataServicesVersions: string;
    support: string;
    scamListUrl: string;
    tokensNameListUrl: string;
    blockHeight: string;
  };
  oracleDCC: string;
  scamListUrl: string;
  tokensNameListUrl: string;
}

/**
 * Per-user settings (specific to each account)
 * Matches Angular defaults
 */
interface UserSettings {
  encryptionRounds: number;
  hasBackup: boolean;
  lastInterval: string; // Chart interval

  send: {
    defaultTab: 'singleSend' | 'massTransfer';
  };

  orderLimit: number;
  pinnedAssetIdList: string[];

  wallet: {
    activeState: 'assets' | 'transactions' | 'leasing' | 'portfolio';
    assets: {
      chartMode: string;
      activeChartAssetId: string;
      chartAssetIdList: string[];
    };
    transactions: {
      filter: string;
    };
    leasing: {
      filter: string;
    };
    portfolio: {
      spam: string[];
      filter: string;
    };
  };

  dex: {
    chartCropRate: number;
    assetIdPair: {
      amount: string;
      price: string;
    };
    createOrder: {
      expirationName: string;
    };
    watchlist: {
      showOnlyFavorite: boolean;
      favourite: string[][];
      activeTab: string;
    };
    layout: {
      watchlist: { collapsed: boolean };
      orderbook: { collapsed: boolean };
      tradevolume: { collapsed: boolean };
    };
  };
}

interface SettingsContextType {
  // Common settings
  commonSettings: CommonSettings;
  getCommonSetting: <K extends keyof CommonSettings>(key: K) => CommonSettings[K];
  setCommonSetting: <K extends keyof CommonSettings>(key: K, value: CommonSettings[K]) => void;

  // User settings
  userSettings: UserSettings | null;
  getUserSetting: <K extends keyof UserSettings>(key: K) => UserSettings[K] | undefined;
  setUserSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;

  // Utilities
  resetToDefaults: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Default common settings
 * Matches Angular commonDefaults
 */
const getDefaultCommonSettings = (): CommonSettings => {
  // Get assets configuration
  const assets = (NetworkConfig.get('assets') as { DCC?: string; CRC?: string; [key: string]: string | undefined }) || {};
  const dccAssetId = assets.DCC || 'DCC';

  return {
    lng: 'en',
    theme: 'default',
    advancedMode: false,
    lastOpenVersion: '',
    whatsNewList: [],
    logoutAfterMin: 5,
    termsAccepted: true,
    needReadNewTerms: false,
    closedNotification: [],
    withScam: false,
    dontShowSpam: true,
    tradeWithScriptAssets: false,
    baseAssetId: dccAssetId,
    events: {},
    network: {
      code: (NetworkConfig.get('code') as string) || '?',
      server: NetworkConfig.node,
      matcher: NetworkConfig.matcher,
      api: NetworkConfig.api,
      coinomat: (NetworkConfig.get('coinomat') as string) || '',
      nodeList: (NetworkConfig.get('nodeList') as string) || '',
      dataServicesVersions: (NetworkConfig.get('featuresConfigUrl') as string) || '',
      support: (NetworkConfig.get('support') as string) || '',
      scamListUrl: (NetworkConfig.get('scamListUrl') as string) || '',
      tokensNameListUrl: (NetworkConfig.get('tokensNameListUrl') as string) || '',
      blockHeight: '', // This would be fetched dynamically
    },
    oracleDCC: NetworkConfig.oracleDCC,
    scamListUrl: (NetworkConfig.get('scamListUrl') as string) || '',
    tokensNameListUrl: (NetworkConfig.get('tokensNameListUrl') as string) || '',
  };
};

/**
 * Default user settings
 * Matches Angular defaults
 */
const getDefaultUserSettings = (): UserSettings => {
  const assets = (NetworkConfig.get('assets') as { DCC?: string; CRC?: string; [key: string]: string | undefined }) || {};
  const dccAssetId = assets.DCC || 'DCC';
  const crcAssetId = assets.CRC || 'CRC';

  return {
    encryptionRounds: 5000,
    hasBackup: true,
    lastInterval: '30', // Default chart interval
    send: {
      defaultTab: 'singleSend',
    },
    orderLimit: 0.05,
    pinnedAssetIdList: [dccAssetId, crcAssetId],
    wallet: {
      activeState: 'assets',
      assets: {
        chartMode: 'month',
        activeChartAssetId: dccAssetId,
        chartAssetIdList: [crcAssetId],
      },
      transactions: {
        filter: 'all',
      },
      leasing: {
        filter: 'all',
      },
      portfolio: {
        spam: [],
        filter: 'active',
      },
    },
    dex: {
      chartCropRate: 1.5,
      assetIdPair: {
        amount: dccAssetId,
        price: crcAssetId,
      },
      createOrder: {
        expirationName: '30day',
      },
      watchlist: {
        showOnlyFavorite: false,
        favourite: [[crcAssetId]],
        activeTab: 'all',
      },
      layout: {
        watchlist: { collapsed: false },
        orderbook: { collapsed: false },
        tradevolume: { collapsed: true },
      },
    },
  };
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [commonSettings, setCommonSettings] = useState<CommonSettings>(getDefaultCommonSettings());
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  /**
   * Apply side effects for setting changes
   * Matches Angular's side effects (theme changes, data-service config updates, etc.)
   */
  const applySideEffects = useCallback(async (key: string, value: unknown) => {
    try {
      switch (key) {
        case 'theme':
          // Apply theme change to document
          document.documentElement.setAttribute('data-theme', String(value || 'default'));
          break;

        case 'network':
        case 'oracleDCC':
        case 'scamListUrl':
        case 'tokensNameListUrl': {
          // Update data-service config
          const ds = await import('data-service');
          const setConfig = ds.config.setConfig as ((config: Record<string, unknown>) => void) | undefined;
          if (setConfig) {
            if (key === 'network' && value) {
              const network = value as { server: string; matcher: string };
              setConfig({
                servers: {
                  nodeAddress: network.server,
                  matcherAddress: network.matcher,
                },
              });
            } else {
              setConfig({ [key]: value });
            }
          }
          break;
        }

        case 'dontShowSpam':
          // Spam filter toggle - handled by components
          logger.debug('[Settings] Spam filter toggled:', value);
          break;

        case 'lng':
          // Language change - would trigger i18n update
          logger.debug('[Settings] Language changed:', value);
          break;

        default:
          // No side effects for other settings
          break;
      }
    } catch (error) {
      logger.error('[Settings] Side effect failed for', key, error);
    }
  }, []);

  /**
   * Load settings from localStorage
   */
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load common settings
      const storedCommon = localStorage.getItem(STORAGE_KEYS.COMMON_SETTINGS);
      if (storedCommon) {
        const parsed = JSON.parse(storedCommon);
        setCommonSettings({ ...getDefaultCommonSettings(), ...parsed });
      } else {
        // Initialize with defaults
        const defaults = getDefaultCommonSettings();
        setCommonSettings(defaults);
        localStorage.setItem(STORAGE_KEYS.COMMON_SETTINGS, JSON.stringify(defaults));
      }

      // Load user-specific settings if user is logged in
      if (user) {
        const storedUser = localStorage.getItem(`${STORAGE_KEYS.USER_SETTINGS}_${user.hash}`);
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUserSettings({ ...getDefaultUserSettings(), ...parsed });
        } else {
          // Initialize with defaults
          const defaults = getDefaultUserSettings();
          setUserSettings(defaults);
          localStorage.setItem(
            `${STORAGE_KEYS.USER_SETTINGS}_${user.hash}`,
            JSON.stringify(defaults),
          );
        }
      } else {
        setUserSettings(null);
      }

      // Apply theme
      const theme = storedCommon ? JSON.parse(storedCommon).theme : 'default';
      document.documentElement.setAttribute('data-theme', theme || 'default');
    } catch (error) {
      logger.error('[Settings] Load failed:', error);
      // Use defaults on error
      setCommonSettings(getDefaultCommonSettings());
      setUserSettings(user ? getDefaultUserSettings() : null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Load settings from localStorage on mount and when user changes
   */
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * Get common setting value
   * Matches Angular DefaultSettings.get() for common settings
   */
  const getCommonSetting = useCallback(
    <K extends keyof CommonSettings>(key: K): CommonSettings[K] => {
      return commonSettings[key];
    },
    [commonSettings],
  );

  /**
   * Set common setting value
   * Matches Angular DefaultSettings.set() for common settings
   */
  const setCommonSetting = useCallback(
    <K extends keyof CommonSettings>(key: K, value: CommonSettings[K]) => {
      const updated = { ...commonSettings, [key]: value };
      setCommonSettings(updated);
      localStorage.setItem(STORAGE_KEYS.COMMON_SETTINGS, JSON.stringify(updated));

      // Trigger side effects
      applySideEffects(key as string, value);
    },
    [commonSettings, applySideEffects],
  );

  /**
   * Get user setting value
   * Matches Angular DefaultSettings.get() for user settings
   */
  const getUserSetting = useCallback(
    <K extends keyof UserSettings>(key: K): UserSettings[K] | undefined => {
      return userSettings?.[key];
    },
    [userSettings],
  );

  /**
   * Set user setting value
   * Matches Angular DefaultSettings.set() for user settings
   */
  const setUserSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      if (!user || !userSettings) {
        logger.warn('[Settings] Cannot set user setting: No user logged in');
        return;
      }

      const updated = { ...userSettings, [key]: value };
      setUserSettings(updated);
      localStorage.setItem(`${STORAGE_KEYS.USER_SETTINGS}_${user.hash}`, JSON.stringify(updated));
    },
    [user, userSettings],
  );

  /**
   * Reset all settings to defaults
   */
  const resetToDefaults = useCallback(async () => {
    try {
      // Reset common settings
      const defaultCommon = getDefaultCommonSettings();
      setCommonSettings(defaultCommon);
      localStorage.setItem(STORAGE_KEYS.COMMON_SETTINGS, JSON.stringify(defaultCommon));

      // Reset user settings if user is logged in
      if (user) {
        const defaultUser = getDefaultUserSettings();
        setUserSettings(defaultUser);
        localStorage.setItem(
          `${STORAGE_KEYS.USER_SETTINGS}_${user.hash}`,
          JSON.stringify(defaultUser),
        );
      }

      // Re-apply theme
      document.documentElement.setAttribute('data-theme', defaultCommon.theme);

      logger.debug('[Settings] Reset to defaults');
    } catch (error) {
      logger.error('[Settings] Reset to defaults failed:', error);
    }
  }, [user]);

  const value: SettingsContextType = {
    commonSettings,
    getCommonSetting,
    setCommonSetting,
    userSettings,
    getUserSetting,
    setUserSetting,
    resetToDefaults,
    isLoading,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

/**
 * Hook to use settings context
 * Must be used within SettingsProvider
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
