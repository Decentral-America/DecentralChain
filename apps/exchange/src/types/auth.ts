/**
 * Authentication related TypeScript types
 */

/**
 * User settings interface
 */
export interface UserSettings {
  theme?: string;
  logoutAfterMin?: number; // Auto-logout timer in minutes (0 = disabled, default: 15)
  pinnedAssetIdList?: string[]; // Pinned assets for portfolio
  'wallet.portfolio.spam'?: string[]; // Spam assets to hide
  [key: string]: unknown; // Allow other settings
}

/**
 * User interface matching the DecentralChain wallet user structure
 * Updated to match Angular's User service structure with multiAccount support
 */
export interface User {
  hash: string; // User identifier hash from multiAccount
  address: string;
  name?: string;
  publicKey: string;
  userType: 'seed' | 'privateKey' | 'ledger' | 'keeper';
  networkByte?: number;
  id?: string; // Optional user ID
  seed?: string; // Decrypted seed (only in memory after auth)
  privateKey?: string; // Decrypted private key (only in memory)
  encryptedSeed?: string; // Encrypted seed stored in local storage
  settings?: UserSettings; // User settings
  matcherSign?: {
    timestamp: number;
    signature: string;
  };
  lastLogin?: number;
  hasScript?: boolean;

  // Ledger-specific fields
  ledgerPath?: string; // BIP44 derivation path (e.g., "44'/5741564'/0'/0'/0'")
  ledgerId?: string; // Address index on Ledger device
}

/**
 * Script info interface for accounts with attached scripts
 */
export interface ScriptInfo {
  hasScript: boolean;
  extraFee: unknown | null; // Money type from @decentralchain/data-entities
  networkError: boolean;
}

/**
 * Authentication context value interface
 * Updated to match Angular's User service with multiAccount support
 */
export interface AuthContextType {
  // Route state management
  saveLastRoute: (section: string, route: string) => void;
  getLastRoute: (section: string) => string;
  getActiveState: (section: 'wallet' | 'dex' | 'settings') => string;
  // Asset management
  togglePinAsset: (assetId: string, state?: boolean) => void;
  toggleSpamAsset: (assetId: string, state?: boolean) => void;
  hasInArrayUserSetting: (path: string, value: string) => boolean;
  // Address validation
  validateAddress: (address: string) => boolean;
  // Scam asset tracking
  isScamAsset: (assetId: string) => boolean;
  getTokenName: (assetId: string, fallback?: string) => string;
  refreshTokenFilters: () => Promise<void>;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionRestored: boolean;
  accounts: User[]; // List of all stored accounts
  scriptInfo: ScriptInfo; // Script polling info for current user
  create: (
    seedPhrase: string,
    password: string,
    name?: string,
    hasBackup?: boolean,
  ) => Promise<void>; // Create new account
  login: (userHash: string, password: string) => Promise<void>; // Login with password
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  switchAccount: (userHash: string, password?: string) => Promise<void>; // Switch account (needs password if signed out)
  addAccount: (seedPhrase: string, name: string) => Promise<User | undefined>; // Import account
  addLedgerAccount: (
    ledgerData: {
      address: string;
      publicKey: string;
      path: string;
      id: string;
    },
    name: string,
    networkByte: number,
  ) => Promise<User>; // Import Ledger hardware wallet
  removeAccount: (userHash: string) => Promise<void>; // Remove account
}
