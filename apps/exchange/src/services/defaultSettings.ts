/**
 * DefaultSettings Service
 *
 * Manages user preferences and settings with localStorage persistence
 * Ports Angular's DefaultSettings.js to React with TypeScript
 *
 * Separates settings into two categories:
 * - Common Settings: Shared across all accounts (theme, language, network config)
 * - User Settings: Per-account preferences (pinned assets, wallet state, DEX preferences)
 */

import NetworkConfig from '@/config/networkConfig';
import { logger } from '@/lib/logger';

/**
 * Common settings shared across all accounts
 */
export interface CommonSettings {
  lng: string;
  theme: 'default' | 'black';
  advancedMode: boolean;
  lastOpenVersion: string;
  whatsNewList: string[];
  network: string;
  oracleDCC: string;
  dontShowSpam: boolean;
  logoutAfterMin: number;
  termsAccepted: boolean;
  needReadNewTerms: boolean;
  closedNotification: string[];
  withScam: boolean;
  scamListUrl: string;
  tokensNameListUrl: string;
  tradeWithScriptAssets: boolean;
  baseAssetId: string;
  events: Record<string, unknown>;
}

/**
 * User-specific settings (per account)
 */
export interface UserSettings {
  encryptionRounds: number;
  hasBackup: boolean;
  lastInterval: string;
  send: {
    defaultTab: string;
  };
  orderLimit: number;
  pinnedAssetIdList: string[];
  wallet: {
    activeState: string;
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

/**
 * DefaultSettings Service
 * Matches Angular's DefaultSettings.js pattern
 */
export class DefaultSettings {
  private static STORAGE_KEY_COMMON = 'commonSettings';
  private static STORAGE_KEY_USER = 'userSettings';

  private commonSettings: Partial<CommonSettings> = {};
  private settings: Partial<UserSettings> = {};

  /**
   * Common defaults matching Angular DefaultSettings.js
   */
  private commonDefaults: CommonSettings = {
    advancedMode: false,
    baseAssetId: 'DCC',
    closedNotification: [],
    dontShowSpam: true,
    events: {},
    lastOpenVersion: '',
    lng: 'en',
    logoutAfterMin: 5,
    needReadNewTerms: false,
    network: NetworkConfig.code,
    oracleDCC: NetworkConfig.oracleDCC,
    scamListUrl: NetworkConfig.scamListUrl,
    termsAccepted: true,
    theme: 'default',
    tokensNameListUrl: NetworkConfig.tokensNameListUrl,
    tradeWithScriptAssets: false,
    whatsNewList: [],
    withScam: false,
  };

  /**
   * User-specific defaults matching Angular DefaultSettings.js
   */
  private defaults: UserSettings = {
    dex: {
      assetIdPair: {
        amount: 'DCC',
        price: 'CRC',
      },
      chartCropRate: 1.5,
      createOrder: {
        expirationName: '30day',
      },
      layout: {
        orderbook: { collapsed: false },
        tradevolume: { collapsed: true },
        watchlist: { collapsed: false },
      },
      watchlist: {
        activeTab: 'all',
        favourite: [['CRC']],
        showOnlyFavorite: false,
      },
    },
    encryptionRounds: 5000,
    hasBackup: true,
    lastInterval: '60', // Default DEX chart resolution
    orderLimit: 0.05,
    pinnedAssetIdList: ['DCC', 'CRC'], // Match Angular default pinned assets
    send: {
      defaultTab: 'singleSend',
    },
    wallet: {
      activeState: 'assets',
      assets: {
        activeChartAssetId: 'DCC',
        chartAssetIdList: ['CRC'],
        chartMode: 'month',
      },
      leasing: {
        filter: 'all',
      },
      portfolio: {
        filter: 'active',
        spam: [],
      },
      transactions: {
        filter: 'all',
      },
    },
  };

  constructor(settings?: Partial<UserSettings>, commonSettings?: Partial<CommonSettings>) {
    this.settings = settings || {};
    this.commonSettings = commonSettings || {};
  }

  /**
   * Get a setting value by path (dot notation supported)
   * Checks common settings first, then user settings
   */
  get<T = unknown>(path: string): T {
    const isCommon = this._isCommon(path);

    if (isCommon) {
      const valueCommon = this._getFromObject(this.commonSettings, path);
      if (valueCommon === undefined || valueCommon === null) {
        return this._getFromObject(this.commonDefaults, path) as T;
      }
      return valueCommon as T;
    }

    const value = this._getFromObject(this.settings, path);
    if (value === undefined || value === null) {
      return this._getFromObject(this.defaults, path) as T;
    }
    return value as T;
  }

  /**
   * Set a setting value by path
   * Automatically determines if it's a common or user setting
   */
  set(path: string, value: unknown): void {
    const isCommon = this._isCommon(path);

    if (isCommon) {
      const defaultValue = this._getFromObject(this.commonDefaults, path);
      if (this._isEqual(defaultValue, value)) {
        this._unsetFromObject(this.commonSettings, path);
      } else {
        this._setToObject(this.commonSettings, path, value);
      }
    } else {
      const defaultValue = this._getFromObject(this.defaults, path);
      if (this._isEqual(defaultValue, value)) {
        this._unsetFromObject(this.settings, path);
      } else {
        this._setToObject(this.settings, path, value);
      }
    }

    // Persist to localStorage
    this._save();
  }

  /**
   * Update common settings object
   */
  setCommonSettings(commonSettings: Partial<CommonSettings>): void {
    this.commonSettings = commonSettings;
    this._save();
  }

  /**
   * Get all settings (common + user)
   */
  getSettings(): { common: Partial<CommonSettings>; settings: Partial<UserSettings> } {
    return {
      common: this.commonSettings,
      settings: this.settings,
    };
  }

  /**
   * Load settings from localStorage
   */
  load(): void {
    try {
      const commonStr = localStorage.getItem(DefaultSettings.STORAGE_KEY_COMMON);
      const userStr = localStorage.getItem(DefaultSettings.STORAGE_KEY_USER);

      if (commonStr) {
        this.commonSettings = JSON.parse(commonStr);
      }
      if (userStr) {
        this.settings = JSON.parse(userStr);
      }
    } catch (error) {
      logger.warn('[DefaultSettings] Failed to load from localStorage:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private _save(): void {
    try {
      localStorage.setItem(DefaultSettings.STORAGE_KEY_COMMON, JSON.stringify(this.commonSettings));
      localStorage.setItem(DefaultSettings.STORAGE_KEY_USER, JSON.stringify(this.settings));
    } catch (error) {
      logger.error('[DefaultSettings] Failed to save to localStorage:', error);
    }
  }

  /**
   * Check if a path refers to a common setting
   */
  private _isCommon(path: string): boolean {
    const [start] = path.split('.');
    return Object.hasOwn(this.commonDefaults, start ?? '');
  }

  /**
   * Get value from nested object using dot notation path
   */
  private _getFromObject(obj: unknown, path: string): unknown {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return;
      }
    }

    return current;
  }

  /**
   * Set value in nested object using dot notation path
   */
  private _setToObject(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey) return;
    let current: Record<string, unknown> = obj;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    current[lastKey] = value;
  }

  /**
   * Remove value from nested object using dot notation path
   */
  private _unsetFromObject(obj: Record<string, unknown>, path: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop();
    if (!lastKey) return;
    let current: Record<string, unknown> = obj;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        return;
      }
      current = current[key] as Record<string, unknown>;
    }

    delete current[lastKey];
  }

  /**
   * Deep equality check
   */
  private _isEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

/**
 * Create a new DefaultSettings instance
 */
export function createDefaultSettings(
  settings?: Partial<UserSettings>,
  commonSettings?: Partial<CommonSettings>,
): DefaultSettings {
  const instance = new DefaultSettings(settings, commonSettings);
  instance.load();
  return instance;
}

/**
 * Singleton instance for easy access
 */
let defaultSettingsInstance: DefaultSettings | null = null;

/**
 * Get the singleton DefaultSettings instance
 */
export function getDefaultSettings(): DefaultSettings {
  if (!defaultSettingsInstance) {
    defaultSettingsInstance = createDefaultSettings();
  }
  return defaultSettingsInstance;
}

export default {
  create: createDefaultSettings,
  getInstance: getDefaultSettings,
};
