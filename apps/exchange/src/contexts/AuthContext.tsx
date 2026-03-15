/**
 * Authentication Context - REWRITTEN
 * Manages user authentication with multiAccount encryption
 * Matches Angular User service exactly
 *
 * CRITICAL: This replaces the current AuthContext.tsx
 * Uses multiAccount service for proper seed encryption
 * Uses correct storage keys (multiAccountData, multiAccountHash, multiAccountUsers)
 * Integrates with data-service (ds.app.login)
 */

import { isValidAddress } from '@decentralchain/signature-adapter';
import * as ds from 'data-service';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { NetworkConfig } from '@/config';
import { useIdleTimer } from '@/hooks/useIdleTimer';
import { useScriptInfoPolling } from '@/hooks/useScriptInfoPolling';
import { trackEvent } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { multiAccount } from '@/services/multiAccount';
import tokenFilterService from '@/services/tokenFilters';
import { type AuthContextType, type User } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Storage keys matching Angular
const STORAGE_KEYS = {
  MULTI_ACCOUNT_DATA: 'multiAccountData',
  MULTI_ACCOUNT_HASH: 'multiAccountHash',
  MULTI_ACCOUNT_SETTINGS: 'multiAccountSettings',
  MULTI_ACCOUNT_USERS: 'multiAccountUsers',
  USER_LIST: 'userList', // Legacy support
} as const;

const DEFAULT_ROUNDS = 600000; // PBKDF2 rounds — OWASP 2024 recommendation for SHA-256

// Session storage key for persisting active session
const SESSION_STORAGE_KEY = 'activeSession';

interface SessionData {
  userHash: string;
  timestamp: number;
}

/**
 * Convert MultiAccountUser to User via type assertion.
 * Safe because multiAccount.toList() merges metadata (name, settings, matcherSign)
 * with encrypted data (publicKey, address, seed) into objects matching the User shape.
 */
const toUser = (mau: import('@/services/multiAccount').MultiAccountUser): User =>
  mau as unknown as User;
const toUsers = (maus: import('@/services/multiAccount').MultiAccountUser[]): User[] =>
  maus.map(toUser);

/**
 * AuthProvider component
 * Provides authentication state with Angular-compatible encryption
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false); // MultiAccount signed in state
  const [sessionRestored, setSessionRestored] = useState(false);

  // Script info polling hook - polls every 10 seconds when authenticated
  const scriptInfo = useScriptInfoPolling(user?.address, !!user);

  /**
   * Apply user's theme preference when user changes
   * Matches Angular: User._addUserData() line 871
   */
  useEffect(() => {
    const applyUserTheme = () => {
      if (user?.settings?.theme) {
        // Apply user's saved theme
        document.documentElement.setAttribute('data-theme', user.settings.theme);
        logger.debug('[Auth] Applied user theme:', user.settings.theme);
      } else if (user) {
        // New user - apply default theme
        document.documentElement.setAttribute('data-theme', 'default');
        logger.debug('[Auth] Applied default theme for new user');
      }
      // If no user (logged out), don't change theme
    };

    applyUserTheme();
  }, [user?.hash, user?.settings?.theme, user]); // Watch user identity and theme changes

  /**
   * Auto-save user settings changes with debouncing
   * Matches Angular: User._onChangePropsForSave() lines 909-919
   */
  useEffect(() => {
    if (!user || !user.hash) return;

    // Debounce settings save (500ms)
    const timer = setTimeout(() => {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}');

      if (users[user.hash]) {
        users[user.hash].settings = user.settings;
        users[user.hash].lastLogin = Date.now();
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS, JSON.stringify(users));
        logger.debug('[Auth] Settings auto-saved for', user.name || user.address);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [user?.settings, user?.hash, user?.name, user?.address, user]); // Watch settings changes

  /**
   * Save session to sessionStorage for auto-restore on page reload
   */
  const saveSession = useCallback((userHash: string) => {
    const sessionData: SessionData = {
      timestamp: Date.now(),
      userHash,
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    logger.debug('[Auth] Session saved for user:', userHash);
  }, []);

  /**
   * Clear session from sessionStorage
   */
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    logger.debug('[Auth] Session cleared');
  }, []);

  /**
   * Dispatch custom login event for components to react
   * Matches Angular: loginSignal.dispatch()
   */
  const dispatchLoginEvent = useCallback((user: User) => {
    window.dispatchEvent(
      new CustomEvent('auth:login', {
        detail: { user },
      }),
    );
    logger.debug('[Auth] Login event dispatched for', user.name || user.address);
  }, []);

  /**
   * Dispatch custom logout event
   * Matches Angular: logoutSignal.dispatch()
   */
  const dispatchLogoutEvent = useCallback(() => {
    window.dispatchEvent(new CustomEvent('auth:logout'));
    logger.debug('[Auth] Logout event dispatched');
  }, []);

  /**
   * Attempt to restore session on app load
   * Only works if vault remains unlocked
   */
  useEffect(() => {
    const validateSession = (): User | null => {
      const sessionStr = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!sessionStr) return null;

      const session: SessionData = JSON.parse(sessionStr);
      const MAX_SESSION_MS = 4 * 60 * 60 * 1000;

      if (Date.now() - session.timestamp >= MAX_SESSION_MS) return null;
      if (!multiAccount.isSignedIn) return null;

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}');
      let allUsers: User[];
      try {
        allUsers = toUsers(multiAccount.toList(stored));
        if (!allUsers?.length) return null;
      } catch {
        return null;
      }

      return allUsers.find((u) => u.hash === session.userHash) ?? null;
    };

    const restoreSession = async () => {
      if (sessionRestored) return;
      try {
        const sessionUser = validateSession();
        if (sessionUser) {
          await ds.app.login(sessionUser);
          setUser(sessionUser);
          setAccounts(
            toUsers(
              multiAccount.toList(
                JSON.parse(localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}'),
              ),
            ),
          );
          setIsSignedIn(true);
          logger.debug('[Auth] Session restored for user');
        } else {
          clearSession();
        }
      } catch {
        logger.error('[Auth] Session restore failed');
        clearSession();
      } finally {
        setSessionRestored(true);
      }
    };

    restoreSession();
  }, [sessionRestored, clearSession]);

  /**
   * Load users from storage on mount
   * Note: Seeds are encrypted, need password to access
   */
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const multiAccountUsers = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}',
        );

        // Get account list (without sensitive data - need password for that)
        const accountList = Object.keys(multiAccountUsers).map((hash) => ({
          address: '', // Will be filled after password auth
          hash,
          lastLogin: multiAccountUsers[hash].lastLogin,
          name: multiAccountUsers[hash].name,
          publicKey: '', // Will be filled after password auth
          settings: multiAccountUsers[hash].settings,
          userType: 'seed' as const,
        }));

        setAccounts(accountList);
      } catch (error) {
        logger.error('Failed to load accounts:', error);
      }
    };

    loadAccounts();
  }, []);

  /**
   * Generate matcher signature for DEX trading
   * Matches Angular: utils.signUserOrders()
   */
  const generateMatcherSign = useCallback(async (): Promise<{
    timestamp: number;
    signature: string;
  }> => {
    try {
      // Generate timestamp 1 day in the future (matching Angular)
      const timestamp = ds.app.getTimeStamp(1, 'day');

      // Generate signature using data-service
      const signature = await ds.app.getSignIdForMatcher(timestamp);

      logger.debug('[Auth] Matcher signature generated:', {
        signatureLength: signature?.length,
        timestamp,
      });

      return {
        signature,
        timestamp,
      };
    } catch (error) {
      logger.error('[Auth] Matcher signature generation failed:', error);
      // Return empty signature (will need to regenerate later)
      return {
        signature: '',
        timestamp: 0,
      };
    }
  }, []);

  /**
   * Check if matcher signature needs refresh
   * Signature is valid for 1 day from timestamp
   * Matches Angular: signUserOrders() expiration check
   */
  const shouldRefreshMatcherSign = useCallback(
    (matcherSign?: { timestamp: number; signature: string }): boolean => {
      if (!matcherSign || !matcherSign.timestamp || !matcherSign.signature) {
        return true; // No signature or incomplete
      }

      // Check if signature timestamp is still in the future (valid)
      const now = Date.now();
      const isExpired = matcherSign.timestamp <= now;

      if (isExpired) {
        logger.debug('[Auth] Matcher signature expired, needs refresh');
      }

      return isExpired;
    },
    [],
  );

  /**
   * Add matcher signature to matcher API
   * Matches Angular: ds.app.addMatcherSign()
   */
  const addMatcherSignToAPI = useCallback(
    async (timestamp: number, signature: string): Promise<void> => {
      try {
        if (ds.app.addMatcherSign) {
          await ds.app.addMatcherSign(timestamp, signature);
          logger.debug('[Auth] Matcher signature added to API');
        }
      } catch (error) {
        logger.error('[Auth] Failed to add matcher signature to API:', error);
        // Don't throw - signature is stored, API call can be retried
      }
    },
    [],
  );

  /**
   * Sync user's network configuration to data-service
   * Matches Angular: User._addUserData() lines 858-864
   * Allows users to configure custom node URLs, matcher URLs, etc.
   */
  const syncNetworkConfig = useCallback(
    async (userSettings: { oracleDCC?: unknown; [key: string]: unknown }) => {
      try {
        // Network keys that can be customized
        const networkKeys = ['node', 'matcher', 'api', 'explorer'];

        // Sync each network setting if user has customized it
        networkKeys.forEach((key) => {
          const settingPath = `network.${key}`;
          const customValue = userSettings?.[settingPath];
          if (customValue && ds.config.set) {
            ds.config.set(key, customValue);
            logger.debug(`[Auth] Synced network.${key} =`, customValue);
          }
        });

        // Sync oracle settings
        const oracleDCC = userSettings?.oracleDCC;
        if (oracleDCC && ds.config.set) {
          ds.config.set('oracleDCC', oracleDCC);
          logger.debug('[Auth] Synced oracleDCC =', oracleDCC);
        }
      } catch (error) {
        logger.error('[Auth] Failed to sync network config:', error);
        // Don't throw - use default network config
      }
    },
    [],
  );

  /**
   * Create new account
   * Matches Angular: User.create()
   *
   * @param seedPhrase - 15-word seed phrase
   * @param password - Master password for encryption
   * @param name - Account name
   * @param hasBackup - Whether user has backed up their seed phrase
   */
  const create = useCallback(
    async (
      seedPhrase: string,
      password: string,
      name: string = 'Account 1',
      hasBackup: boolean = false,
    ) => {
      setIsLoading(true);
      try {
        // 1. Check if first account (need to signUp)
        const multiAccountData = localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_DATA);

        if (!multiAccountData) {
          // First account - initialize multiAccount with password
          await multiAccount.signUp(password, DEFAULT_ROUNDS);
        } else {
          // Existing accounts - sign in to decrypt
          const hash = localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_HASH) ?? '';
          await multiAccount.signIn(multiAccountData, password, DEFAULT_ROUNDS, hash);
        }

        setIsSignedIn(true);

        // 2. Add user via multiAccount (encrypts seed!)
        const {
          multiAccountData: newData,
          multiAccountHash,
          userHash,
        } = await multiAccount.addUser({
          networkByte: NetworkConfig.networkByte, // Computed from mainnet.json code
          seed: seedPhrase,
          userType: 'seed',
        });

        // 3. Save encrypted data (Angular storage keys!)
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_DATA, newData);
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_HASH, multiAccountHash);

        // 4. Save user metadata (not encrypted - name, settings only)
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}');
        users[userHash] = {
          lastLogin: Date.now(),
          matcherSign: null,
          name,
          settings: { hasBackup }, // CRITICAL: Track if user backed up seed
        };
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS, JSON.stringify(users));

        // 5. Get full user object with decrypted data
        const allUsers = toUsers(multiAccount.toList(users));
        const createdUser = allUsers.find((u) => u.hash === userHash);

        if (!createdUser) {
          throw new Error('Failed to create user');
        }

        // 6. Login via data-service (CRITICAL!)

        await ds.app.login(createdUser);

        // 6.5. Sync network configuration
        await syncNetworkConfig(users[userHash].settings);

        // 7. Generate matcher signature for DEX trading
        // Matches Angular: utils.signUserOrders()
        const matcherSign = await generateMatcherSign();

        // Add signature to matcher API
        if (matcherSign.signature) {
          await addMatcherSignToAPI(matcherSign.timestamp, matcherSign.signature);
        }

        // 8. Update user with matcher sign
        users[userHash].matcherSign = matcherSign;
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS, JSON.stringify(users));

        // 9. Set active user
        setUser({
          ...createdUser,
          matcherSign,
        } as User);

        // 10. Update accounts list
        setAccounts(allUsers);

        // 11. Dispatch login event
        dispatchLoginEvent({ ...createdUser, matcherSign } as User);

        // 12. Save session for auto-restore
        saveSession(userHash);

        // 13. Track analytics event
        trackEvent('User', 'Create Success');
      } catch (error) {
        logger.error('Account creation failed:', error);
        setIsSignedIn(false);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [saveSession, generateMatcherSign, addMatcherSignToAPI, syncNetworkConfig, dispatchLoginEvent],
  );

  /**
   * Login with existing account
   * Matches Angular: User.login()
   *
   * @param userHash - User identifier hash
   * @param password - Master password
   */
  const login = useCallback(
    async (userHash: string, password: string) => {
      setIsLoading(true);
      try {
        // 1. Get encrypted data
        const multiAccountData = localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_DATA);
        const multiAccountHash = localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_HASH);

        if (!multiAccountData || !multiAccountHash) {
          throw new Error('No accounts found');
        }

        // 2. Decrypt with password (verifies password is correct)
        await multiAccount.signIn(multiAccountData, password, DEFAULT_ROUNDS, multiAccountHash);
        setIsSignedIn(true);

        // 3. Get user metadata
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}');

        // 4. Get full user list with decrypted data
        const allUsers = toUsers(multiAccount.toList(users));
        const targetUser = allUsers.find((u) => u.hash === userHash);

        if (!targetUser) {
          throw new Error('User not found');
        }

        // 5. Update last login time
        users[userHash].lastLogin = Date.now();
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS, JSON.stringify(users));

        // 6. Login via data-service (CRITICAL!)

        await ds.app.login(targetUser);

        // 6.5. Sync network configuration
        await syncNetworkConfig(users[userHash].settings);

        // 7. Check and refresh matcher signature if needed
        let matcherSign = users[userHash].matcherSign;
        if (shouldRefreshMatcherSign(matcherSign)) {
          logger.debug('[Auth] Refreshing expired matcher signature on login');
          matcherSign = await generateMatcherSign();

          // Add signature to matcher API
          if (matcherSign.signature) {
            await addMatcherSignToAPI(matcherSign.timestamp, matcherSign.signature);
          }

          // Update in storage
          users[userHash].matcherSign = matcherSign;
          localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS, JSON.stringify(users));
        } else {
          // Signature still valid, but ensure it's added to API
          if (matcherSign?.signature) {
            await addMatcherSignToAPI(matcherSign.timestamp, matcherSign.signature);
          }
        }

        // 8. Set active user with matcher signature
        setUser({
          ...targetUser,
          matcherSign,
        } as User);
        setAccounts(allUsers);

        logger.debug('[Auth] User logged in:', {
          address: targetUser.address,
          hasSeed: !!targetUser.seed,
          name: targetUser.name,
          userType: targetUser.userType,
        });

        // 9. Dispatch login event
        dispatchLoginEvent({ ...targetUser, matcherSign } as User);

        // 10. Save session for auto-restore
        saveSession(userHash);

        // 11. Track analytics event
        trackEvent('User', 'Sign In Success');
      } catch (error) {
        logger.error('Login failed:', error);
        setIsSignedIn(false);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [
      saveSession,
      generateMatcherSign,
      shouldRefreshMatcherSign,
      addMatcherSignToAPI,
      syncNetworkConfig,
      dispatchLoginEvent,
    ],
  );

  /**
   * Generate matcher signature for DEX trading
  /**
   * Logout current user
   * Matches Angular: User.logout()
   */
  const logout = useCallback(async () => {
    try {
      // 1. Clear session
      clearSession();

      // 2. Logout from data-service

      if (ds.app.logOut) {
        ds.app.logOut();
      }

      // 3. Clear multiAccount memory (CRITICAL for security!)
      multiAccount.signOut();
      setIsSignedIn(false);

      // 4. Clear user state
      setUser(null);

      // 5. Dispatch logout event
      dispatchLogoutEvent();

      // Note: Don't clear localStorage - accounts remain for next login
    } catch (error) {
      logger.error('Logout error:', error);
    }
  }, [clearSession, dispatchLogoutEvent]);

  /**
   * Update user data
   */
  const updateUser = useCallback(
    (userData: Partial<User>) => {
      if (!user) return;

      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);

      // Update in accounts list
      setAccounts((prev) => prev.map((acc) => (acc.hash === user.hash ? updatedUser : acc)));

      // Update metadata in storage
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}');
      if (users[user.hash]) {
        users[user.hash] = {
          ...users[user.hash],
          lastLogin: Date.now(),
          name: updatedUser.name,
          settings: updatedUser.settings,
        };
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS, JSON.stringify(users));
      }
    },
    [user],
  );

  /**
   * Switch to different account
   * Requires password if multiAccount is signed out
   */
  const switchAccount = useCallback(
    async (userHash: string, password?: string) => {
      if (!isSignedIn && !password) {
        throw new Error('Password required to switch accounts');
      }

      try {
        // If not signed in, sign in first
        if (!isSignedIn && password) {
          const multiAccountData = localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_DATA) ?? '';
          const multiAccountHash = localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_HASH) ?? '';
          await multiAccount.signIn(multiAccountData, password, DEFAULT_ROUNDS, multiAccountHash);
          setIsSignedIn(true);
        }

        // Get user from multiAccount
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}');
        const allUsers = toUsers(multiAccount.toList(users));
        const targetUser = allUsers.find((u) => u.hash === userHash);

        if (!targetUser) {
          throw new Error('User not found');
        }

        // Update last login
        users[userHash].lastLogin = Date.now();

        // Login via data-service

        await ds.app.login(targetUser);

        // Sync network configuration
        await syncNetworkConfig(users[userHash].settings);

        // Check and refresh matcher signature if needed
        let matcherSign = users[userHash].matcherSign;
        if (shouldRefreshMatcherSign(matcherSign)) {
          logger.debug('[Auth] Refreshing expired matcher signature on account switch');
          matcherSign = await generateMatcherSign();

          // Add signature to matcher API
          if (matcherSign.signature) {
            await addMatcherSignToAPI(matcherSign.timestamp, matcherSign.signature);
          }

          // Update in storage
          users[userHash].matcherSign = matcherSign;
        } else {
          // Signature still valid, but ensure it's added to API
          if (matcherSign?.signature) {
            await addMatcherSignToAPI(matcherSign.timestamp, matcherSign.signature);
          }
        }

        // Save updated users with matcher signature
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS, JSON.stringify(users));

        setUser({
          ...targetUser,
          matcherSign,
        } as User);

        // Track analytics event
        trackEvent('User', 'Switch Account Success');

        // Save session for auto-restore
        saveSession(userHash);
      } catch (error) {
        logger.error('Switch account failed:', error);
        throw error;
      }
    },
    [
      isSignedIn,
      saveSession,
      generateMatcherSign,
      shouldRefreshMatcherSign,
      addMatcherSignToAPI,
      syncNetworkConfig,
    ],
  );

  /**
   * Add new account (import)
   * Requires password and multiAccount to be signed in
   */
  const addAccount = useCallback(
    async (seedPhrase: string, name: string) => {
      if (!isSignedIn) {
        throw new Error('Must be signed in to add account');
      }

      try {
        // Add user via multiAccount
        const { multiAccountData, multiAccountHash, userHash } = await multiAccount.addUser({
          networkByte: NetworkConfig.networkByte, // Computed from mainnet.json code
          seed: seedPhrase,
          userType: 'seed',
        });

        // Save encrypted data
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_DATA, multiAccountData);
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_HASH, multiAccountHash);

        // Save metadata
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}');
        users[userHash] = {
          lastLogin: Date.now(),
          matcherSign: null,
          name,
          settings: { hasBackup: false },
        };
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS, JSON.stringify(users));

        // Update accounts list
        const allUsers = toUsers(multiAccount.toList(users));
        setAccounts(allUsers);

        // Track analytics event
        trackEvent('User', 'Import Backup Success');

        return allUsers.find((u) => u.hash === userHash);
      } catch (error) {
        logger.error('Add account failed:', error);
        throw error;
      }
    },
    [isSignedIn],
  );

  /**
   * Remove account
   */
  const removeAccount = useCallback(
    async (userHash: string) => {
      if (!isSignedIn) {
        throw new Error('Must be signed in to remove account');
      }

      try {
        // Delete from multiAccount
        const { multiAccountData, multiAccountHash } = await multiAccount.deleteUser(userHash);

        // Save updated encrypted data
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_DATA, multiAccountData);
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_HASH, multiAccountHash);

        // Remove metadata
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}');
        delete users[userHash];
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS, JSON.stringify(users));

        // Update accounts list
        const allUsers = toUsers(multiAccount.toList(users));
        setAccounts(allUsers);

        // If removing current user, logout
        if (user?.hash === userHash) {
          await logout();
        }
      } catch (error) {
        logger.error('Remove account failed:', error);
        throw error;
      }
    },
    [isSignedIn, user, logout],
  );

  /**
   * Add Ledger Account
   * CRITICAL: Adds Ledger hardware wallet account to multiAccount system
   * Matches Angular: LedgerCtrl.login() and User.create()
   *
   * @param ledgerData - Ledger device data from useLedger
   * @param name - Account name
   * @param networkByte - DecentralChain network byte (from ConfigContext)
   * @returns Created user
   */
  const addLedgerAccount = useCallback(
    async (
      ledgerData: {
        address: string;
        publicKey: string;
        path: string; // BIP44 derivation path
        id: string; // Address index
      },
      name: string,
      networkByte: number,
    ) => {
      if (!isSignedIn) {
        throw new Error('Must be signed in to add Ledger account');
      }

      try {
        // Validate address (pass networkByte for validation)
        if (!isValidAddress(ledgerData.address, networkByte)) {
          throw new Error('Invalid Ledger address');
        }

        // Check for duplicate address
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}');
        const allUsers = toUsers(multiAccount.toList(users));
        const existingUser = allUsers.find((u) => u.address === ledgerData.address);

        if (existingUser) {
          throw new Error(`Account with address ${ledgerData.address} already exists`);
        }

        // Add Ledger user to multiAccount
        // KEY: No seed/privateKey - device holds private key
        const { multiAccountData, multiAccountHash, userHash } = await multiAccount.addUser({
          id: ledgerData.id,
          ledgerId: ledgerData.id,
          ledgerPath: ledgerData.path,
          networkByte,
          publicKey: ledgerData.publicKey,
          userType: 'ledger',
        });

        // Save encrypted data
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_DATA, multiAccountData);
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_HASH, multiAccountHash);

        // Save metadata (unencrypted settings, name, etc.)
        users[userHash] = {
          lastLogin: Date.now(),
          matcherSign: null,
          name,
          settings: { hasBackup: true }, // Ledger = hardware backup
        };
        localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS, JSON.stringify(users));

        // Update accounts list
        const updatedUsers = toUsers(multiAccount.toList(users));
        setAccounts(updatedUsers);

        // Track analytics
        trackEvent('User', 'Import Ledger Success');

        // Return created user
        const createdUser = updatedUsers.find((u) => u.hash === userHash);
        if (!createdUser) {
          throw new Error('Failed to create Ledger account');
        }

        logger.debug('[Auth] Ledger account added:', {
          address: createdUser.address,
          ledgerPath: createdUser.ledgerPath,
          name: createdUser.name,
          userType: createdUser.userType,
        });

        return createdUser;
      } catch (error) {
        logger.error('Add Ledger account failed:', error);
        throw error;
      }
    },
    [isSignedIn],
  );

  /**
   * Auto-logout timer based on user inactivity
   * Matches Angular: User._logoutTimer() lines 891-897
   */
  const idleMinutes = useIdleTimer({ enabled: !!user });

  useEffect(() => {
    if (!user) return;

    // Get logout threshold from settings (default 15 minutes)
    const logoutThreshold = user.settings?.logoutAfterMin ?? 15;

    // If set to 0, auto-logout is disabled
    if (logoutThreshold === 0) return;

    // Check if idle time exceeds threshold
    if (idleMinutes >= logoutThreshold) {
      logger.debug('[Auth] Auto-logout triggered after', idleMinutes, 'minutes of inactivity');
      logout();
    }
  }, [idleMinutes, user, logout]); // Check whenever idle time changes

  /**
   * Save user's last active route within a section
   * Matches Angular: User.applyState() lines 601-604
   * @param section - Main section (wallet, dex, settings)
   * @param route - Full route path (e.g., '/desktop/wallet/leasing')
   */
  const saveLastRoute = useCallback(
    (section: string, route: string) => {
      if (!user) return;

      try {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS) || '{}');

        if (users[user.hash]) {
          const settings = users[user.hash].settings || {};
          settings[`${section}.activeState`] = route;
          users[user.hash].settings = settings;
          localStorage.setItem(STORAGE_KEYS.MULTI_ACCOUNT_USERS, JSON.stringify(users));
          logger.debug(`[Auth] Saved last route for ${section}:`, route);
        }
      } catch (error) {
        logger.error('[Auth] Failed to save last route:', error);
      }
    },
    [user],
  );

  /**
   * Get user's last active route within a section
   * Matches Angular: User.getActiveState() lines 587-595
   * @param section - Main section (wallet, dex, settings)
   * @returns Last active route or empty string if not found
   */
  const getLastRoute = useCallback(
    (section: string): string => {
      if (!user) return '';

      const settingKey = `${section}.activeState`;
      return (user.settings?.[settingKey] as string) || '';
    },
    [user],
  );

  /**
   * Get active state for a section with smart defaults
   * Matches Angular: User.getActiveState() lines 587-595
   * Returns full React Router path with fallback to sensible defaults
   * @param section - Main section (wallet, dex, settings)
   * @returns Full route path for the section
   */
  const getActiveState = useCallback(
    (section: 'wallet' | 'dex' | 'settings'): string => {
      // Define default routes for each section
      // Matches Angular's default state paths but using React Router format
      const defaults: Record<string, string> = {
        dex: '/desktop/dex',
        settings: '/desktop/settings/general',
        wallet: '/desktop/wallet', // Dashboard overview page
      };

      // Get user's last active route for this section directly
      // Don't use getLastRoute to avoid dependency issues
      if (user) {
        const settingKey = `${section}.activeState`;
        const lastRoute = user.settings?.[settingKey] as string | undefined;
        if (lastRoute) {
          return lastRoute;
        }
      }

      // Return default for section
      return defaults[section] ?? '';
    },
    [user],
  );

  /**
   * Helper function to check if a value exists in array user setting
   * Matches Angular: User.hasInArrayUserSetting() lines 257-263
   * @param path - Setting path (e.g., 'pinnedAssetIdList', 'wallet.portfolio.spam')
   * @param value - Value to check for
   * @returns True if value exists in array
   */
  const hasInArrayUserSetting = useCallback(
    (path: string, value: string): boolean => {
      if (!user) return false;

      const list = (user.settings?.[path] as string[]) || [];
      return list.includes(value);
    },
    [user],
  );

  /**
   * Toggle asset pinning status
   * Matches Angular: User.togglePinAsset() lines 210-215
   * Pinned assets appear at top of portfolio
   * Pinning an asset automatically removes it from spam
   * @param assetId - Asset ID to pin/unpin
   * @param state - Optional explicit state (true to pin, false to unpin)
   */
  const togglePinAsset = useCallback(
    (assetId: string, state?: boolean): void => {
      if (!user) return;

      const pinnedList = (user.settings?.pinnedAssetIdList as string[]) || [];
      const index = pinnedList.indexOf(assetId);
      const shouldPin = state !== undefined ? state : index === -1;

      const newList = [...pinnedList];

      if (shouldPin && index === -1) {
        newList.push(assetId);
      } else if (!shouldPin && index !== -1) {
        newList.splice(index, 1);
      } else {
        return; // No change needed
      }

      // Update settings
      const newSettings = {
        ...user.settings,
        pinnedAssetIdList: newList,
      };

      // If pinning, also remove from spam
      if (shouldPin) {
        const spamList = (newSettings['wallet.portfolio.spam'] as string[]) || [];
        const spamIndex = spamList.indexOf(assetId);
        if (spamIndex !== -1) {
          const newSpamList = [...spamList];
          newSpamList.splice(spamIndex, 1);
          newSettings['wallet.portfolio.spam'] = newSpamList;
        }
      }

      updateUser({ settings: newSettings });
    },
    [user, updateUser],
  );

  /**
   * Toggle asset spam status
   * Matches Angular: User.toggleSpamAsset() lines 220-225
   * Spam assets are hidden by default in portfolio
   * Marking as spam automatically removes from pinned
   * @param assetId - Asset ID to mark/unmark as spam
   * @param state - Optional explicit state (true to mark spam, false to unmark)
   */
  const toggleSpamAsset = useCallback(
    (assetId: string, state?: boolean): void => {
      if (!user) return;

      const spamList = (user.settings?.['wallet.portfolio.spam'] as string[]) || [];
      const index = spamList.indexOf(assetId);
      const shouldSpam = state !== undefined ? state : index === -1;

      const newList = [...spamList];

      if (shouldSpam && index === -1) {
        newList.push(assetId);
      } else if (!shouldSpam && index !== -1) {
        newList.splice(index, 1);
      } else {
        return; // No change needed
      }

      // Update settings
      const newSettings = {
        ...user.settings,
        'wallet.portfolio.spam': newList,
      };

      // If marking as spam, also remove from pinned
      if (shouldSpam) {
        const pinnedList = (newSettings.pinnedAssetIdList as string[]) || [];
        const pinnedIndex = pinnedList.indexOf(assetId);
        if (pinnedIndex !== -1) {
          const newPinnedList = [...pinnedList];
          newPinnedList.splice(pinnedIndex, 1);
          newSettings.pinnedAssetIdList = newPinnedList;
        }
      }

      updateUser({ settings: newSettings });
    },
    [user, updateUser],
  );

  /**
   * Validate address for current network
   * Matches Angular: User.isValidAddress() lines 630-636
   * Validates address checksum for DCC network (byte 63)
   * @param address - Address to validate
   * @returns True if address is valid for DCC network
   */
  const validateAddress = useCallback((address: string): boolean => {
    try {
      // DCC network byte is 63 ('?' character)
      // DecentralChain network byte is 63 ('?' character)
      return isValidAddress(address, 63);
    } catch (error) {
      logger.error('[Auth] Address validation error:', error);
      return false;
    }
  }, []);

  /**
   * Initialize token filter service on mount and when user logs in
   * Matches Angular: User.setScam() lines 183-189
   */
  useEffect(() => {
    // Initialize token filters (scam list + verified names)
    tokenFilterService.initialize().catch((error) => {
      logger.error('[Auth] Token filter initialization failed:', error);
    });
  }, []); // Initialize once on mount

  /**
   * Check if asset is on scam list
   * Matches Angular: User.scam property lines 78-79
   * @param assetId - Asset ID to check
   * @returns True if asset is a known scam
   */
  const isScamAsset = useCallback((assetId: string): boolean => {
    return tokenFilterService.isScam(assetId);
  }, []);

  /**
   * Get token display name (ticker or name)
   * @param assetId - Asset ID to look up
   * @param fallback - Fallback name if not found
   * @returns Token name/ticker or fallback
   */
  const getTokenName = useCallback((assetId: string, fallback?: string): string => {
    return tokenFilterService.getDisplayName(assetId, fallback);
  }, []);

  /**
   * Refresh scam list and token names
   * Matches Angular: User.setScam() and User.setTokensNameList() lines 183-193
   */
  const refreshTokenFilters = useCallback(async (): Promise<void> => {
    try {
      await tokenFilterService.refresh();
      logger.debug('[Auth] Token filters refreshed');
    } catch (error) {
      logger.error('[Auth] Token filter refresh failed:', error);
    }
  }, []);

  const value: AuthContextType = {
    accounts,
    addAccount,
    addLedgerAccount, // NEW: Add Ledger account
    create, // New method for account creation
    getActiveState,
    getLastRoute,
    getTokenName,
    hasInArrayUserSetting,
    isAuthenticated: !!user,
    isLoading,
    isScamAsset,
    login,
    logout,
    refreshTokenFilters,
    removeAccount,
    saveLastRoute,
    scriptInfo,
    sessionRestored,
    switchAccount,
    togglePinAsset,
    toggleSpamAsset,
    updateUser,
    user,
    validateAddress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth hook
 * Access authentication state and methods
 * @throws {Error} if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
