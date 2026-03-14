import { useCallback } from 'react';
import { useStorage } from './useStorage';

/**
 * Account interface representing a wallet account
 */
export interface Account {
  address: string;
  name?: string;
  publicKey: string;
  userType: 'seed' | 'privateKey' | 'ledger' | 'keeper';
}

/**
 * Custom hook for managing multiple wallet accounts
 * Provides functionality for adding, removing, and switching between accounts
 * All data is persisted to localStorage
 */
export const useMultiAccount = () => {
  const [accounts, setAccounts] = useStorage<Account[]>('wallet_accounts', []);
  const [currentAccountAddress, setCurrentAccountAddress] = useStorage<string | null>(
    'current_account',
    null
  );

  /**
   * Add a new account to the list
   * If no current account is set, the new account becomes the current one
   */
  const addAccount = useCallback(
    (account: Account) => {
      setAccounts((prev) => {
        // Check if account already exists
        const exists = prev.some((acc) => acc.address === account.address);
        if (exists) {
          console.warn(`Account with address ${account.address} already exists`);
          return prev;
        }
        return [...prev, account];
      });

      // Set as current account if none is selected
      if (!currentAccountAddress) {
        setCurrentAccountAddress(account.address);
      }
    },
    [currentAccountAddress, setAccounts, setCurrentAccountAddress]
  );

  /**
   * Remove an account from the list
   * If the removed account was the current one, switch to the first available account
   */
  const removeAccount = useCallback(
    (address: string) => {
      setAccounts((prev) => {
        const filtered = prev.filter((acc) => acc.address !== address);
        return filtered;
      });

      // If we're removing the current account, switch to another one
      if (currentAccountAddress === address) {
        setAccounts((prev) => {
          const remaining = prev.filter((acc) => acc.address !== address);
          setCurrentAccountAddress(remaining[0]?.address || null);
          return remaining;
        });
      }
    },
    [currentAccountAddress, setAccounts, setCurrentAccountAddress]
  );

  /**
   * Switch to a different account
   */
  const switchAccount = useCallback(
    (address: string) => {
      const accountExists = accounts.some((acc) => acc.address === address);
      if (!accountExists) {
        console.error(`Account with address ${address} not found`);
        return;
      }
      setCurrentAccountAddress(address);
    },
    [accounts, setCurrentAccountAddress]
  );

  /**
   * Update account information (name, etc.)
   */
  const updateAccount = useCallback(
    (address: string, updates: Partial<Omit<Account, 'address'>>) => {
      setAccounts((prev) =>
        prev.map((acc) => (acc.address === address ? { ...acc, ...updates } : acc))
      );
    },
    [setAccounts]
  );

  /**
   * Get the currently selected account
   */
  const currentAccount = accounts.find((acc) => acc.address === currentAccountAddress);

  /**
   * Check if an account exists
   */
  const hasAccount = useCallback(
    (address: string) => {
      return accounts.some((acc) => acc.address === address);
    },
    [accounts]
  );

  /**
   * Get account by address
   */
  const getAccount = useCallback(
    (address: string) => {
      return accounts.find((acc) => acc.address === address);
    },
    [accounts]
  );

  return {
    // State
    accounts,
    currentAccount,
    currentAccountAddress,

    // Actions
    addAccount,
    removeAccount,
    switchAccount,
    updateAccount,

    // Utilities
    hasAccount,
    getAccount,
  };
};
