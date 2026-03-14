/**
 * useBalanceWatcher Hook
 * Monitors wallet balances with automatic polling and real-time updates
 * Provides balance data for the current account with configurable refresh intervals
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useAddressBalance, AddressBalance } from '../api/services/addressService';

/**
 * Balance Watcher Configuration Options
 */
export interface BalanceWatcherOptions {
  /**
   * Polling interval in milliseconds (default: 1000ms = 1s)
   */
  interval?: number;

  /**
   * Enable/disable automatic polling
   */
  enabled?: boolean;

  /**
   * Refetch on window focus
   */
  refetchOnWindowFocus?: boolean;

  /**
   * Stale time in milliseconds before data is considered stale
   */
  staleTime?: number;

  /**
   * Callback when balance changes are detected
   */
  onBalanceChange?: (newBalance: AddressBalance, oldBalance?: AddressBalance) => void;
}

/**
 * Balance Watcher Return Type
 */
export interface BalanceWatcherReturn {
  /**
   * Current balance data including WAVES and all assets
   */
  balances: AddressBalance | undefined;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Is data currently being fetched
   */
  isFetching: boolean;

  /**
   * Manually trigger a balance refresh
   */
  forceRefresh: () => void;

  /**
   * Start automatic polling
   */
  startPolling: () => void;

  /**
   * Stop automatic polling
   */
  stopPolling: () => void;

  /**
   * Check if polling is currently active
   */
  isPolling: boolean;

  /**
   * Current account address being watched
   */
  address: string | null;

  /**
   * Get balance for a specific asset by asset ID
   * Returns 0 if asset not found
   */
  getBalanceByAsset: (assetId: string) => number;

  /**
   * Get all asset balances as an array
   * Returns array of {assetId, balance} objects
   */
  getFullBalanceList: () => Array<{ assetId: string; balance: number }>;
}

/**
 * Custom hook for watching and auto-updating wallet balances
 * Polls blockchain node for balance updates at configurable intervals
 *
 * @param options - Configuration options for balance watcher
 * @returns Balance data and control functions
 *
 * @example
 * ```tsx
 * const { balances, isLoading, forceRefresh, getBalanceByAsset } = useBalanceWatcher({
 *   interval: 1000, // Poll every 1 second (default)
 *   onBalanceChange: (newBalance, oldBalance) => {
 *     console.log('Balance updated!', newBalance);
 *   }
 * });
 *
 * if (isLoading) return <Spinner />;
 *
 * return (
 *   <div>
 *     <p>WAVES Balance: {balances?.balance}</p>
 *     <button onClick={forceRefresh}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export const useBalanceWatcher = (options: BalanceWatcherOptions = {}): BalanceWatcherReturn => {
  const {
    interval = 1000, // Default: 1 second (matches Angular BalanceWatcher)
    enabled = true,
    onBalanceChange,
  } = options;

  const { user } = useAuth();
  const address = user?.address || null;

  // Track previous balance for change detection
  const previousBalanceRef = useRef<AddressBalance | undefined>(undefined);

  // Track polling state
  const [isPollingEnabled, setIsPollingEnabled] = useState(enabled);

  /**
   * Use the addressService hook for balance fetching with React Query
   */
  const {
    data: balances,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useAddressBalance(address || '', {
    enabled: !!address && isPollingEnabled,
    refetchInterval: isPollingEnabled ? interval : undefined,
  }) as UseQueryResult<AddressBalance, Error>;

  /**
   * Detect balance changes and trigger callback
   */
  useEffect(() => {
    if (!balances || !onBalanceChange) return;

    const hasChanged =
      !previousBalanceRef.current ||
      balances.balance !== previousBalanceRef.current.balance ||
      JSON.stringify(balances.assets) !== JSON.stringify(previousBalanceRef.current.assets);

    if (hasChanged) {
      onBalanceChange(balances, previousBalanceRef.current);
      previousBalanceRef.current = balances;
    }
  }, [balances, onBalanceChange]);

  /**
   * Manually trigger a balance refresh
   */
  const forceRefresh = useCallback(() => {
    if (!address) {
      console.warn('useBalanceWatcher: No address available for refresh');
      return;
    }
    refetch();
  }, [address, refetch]);

  /**
   * Start automatic polling
   */
  const startPolling = useCallback(() => {
    setIsPollingEnabled(true);
  }, []);

  /**
   * Stop automatic polling
   */
  const stopPolling = useCallback(() => {
    setIsPollingEnabled(false);
  }, []);

  /**
   * Get balance for a specific asset by asset ID
   * Matches Angular BalanceWatcher.getBalanceByAsset functionality
   */
  const getBalanceByAsset = useCallback(
    (assetId: string): number => {
      if (!balances?.assets) return 0;
      return balances.assets[assetId] ?? 0;
    },
    [balances]
  );

  /**
   * Get all asset balances as an array
   * Matches Angular BalanceWatcher.getFullBalanceList functionality
   */
  const getFullBalanceList = useCallback((): Array<{ assetId: string; balance: number }> => {
    if (!balances?.assets) return [];
    return Object.entries(balances.assets).map(([assetId, balance]) => ({
      assetId,
      balance,
    }));
  }, [balances]);

  /**
   * Log balance updates in development
   */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && balances) {
      console.log('[useBalanceWatcher] Balance updated:', {
        address,
        balance: balances.balance,
        assetsCount: Object.keys(balances.assets || {}).length,
      });
    }
  }, [balances, address]);

  return {
    balances,
    isLoading,
    error: error as Error | null,
    isFetching,
    forceRefresh,
    startPolling,
    stopPolling,
    isPolling: isPollingEnabled,
    address,
    getBalanceByAsset,
    getFullBalanceList,
  };
};

/**
 * Hook variant for watching specific asset balance
 * Extracts and returns balance for a single asset
 */
export const useAssetBalance = (assetId: string | null, options: BalanceWatcherOptions = {}) => {
  const { balances, ...rest } = useBalanceWatcher(options);

  const assetBalance = assetId && balances?.assets?.[assetId];

  return {
    balance: assetBalance ?? 0,
    balances,
    ...rest,
  };
};

/**
 * Hook variant for watching WAVES balance only
 */
export const useWavesBalance = (options: BalanceWatcherOptions = {}) => {
  const { balances, ...rest } = useBalanceWatcher(options);

  return {
    balance: balances?.balance ?? 0,
    balances,
    ...rest,
  };
};
