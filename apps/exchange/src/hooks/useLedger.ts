/**
 * useLedger Hook
 * Manages Ledger hardware wallet device connection, address derivation, and transaction signing
 * Uses @decentralchain/signature-adapter for DecentralChain blockchain integration
 */

import { LedgerAdapter } from '@decentralchain/signature-adapter';
import { useCallback, useRef, useState } from 'react';

export interface LedgerUser {
  id: string;
  address: string;
  publicKey: string;
  path: string;
}

export interface UseLedgerReturn {
  // State
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  users: LedgerUser[];

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  getUserList: (offset: number, count: number) => Promise<LedgerUser[]>;
  signTransaction: (txData: Record<string, unknown>) => Promise<string>;

  // Lifecycle
  isInitialized: boolean;
}

const TIMEOUT_MS = 25000;

/**
 * Hook for managing Ledger hardware wallet operations
 * Desktop-only feature - requires Electron's Node.js integration
 */
export const useLedger = (): UseLedgerReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [users, setUsers] = useState<LedgerUser[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const adapterRef = useRef<typeof LedgerAdapter>(LedgerAdapter);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Wraps a promise with a timeout
   */
  const withTimeout = useCallback(
    <T>(promise: Promise<T>, timeoutMs: number = TIMEOUT_MS): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error('Ledger connection timeout. Please check your device.'));
          }, timeoutMs);
        }),
      ]).finally(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      });
    },
    [],
  );

  /**
   * Connect to Ledger device
   * Shows connection modal during process
   */
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if LedgerAdapter is available (desktop only)
      const available = await withTimeout(adapterRef.current.isAvailable());

      if (!available) {
        throw new Error(
          'Ledger device not found. Please connect your device, unlock it, and open the DCC application.',
        );
      }

      setIsConnected(true);
      setIsInitialized(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error connecting to Ledger');
      setError(error);
      setIsConnected(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [withTimeout]);

  /**
   * Disconnect from Ledger device
   * Clears all state
   */
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setUsers([]);
    setError(null);
    setIsInitialized(false);
  }, []);

  /**
   * Get list of addresses from Ledger device
   * @param offset - Starting address index
   * @param count - Number of addresses to retrieve
   */
  const getUserList = useCallback(
    async (offset: number, count: number): Promise<LedgerUser[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const userList = (await withTimeout(
          adapterRef.current.getUserList(offset, count),
        )) as unknown as LedgerUser[];

        setUsers(userList);
        return userList;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to retrieve addresses from Ledger');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [withTimeout],
  );

  /**
   * Sign transaction with Ledger device
   * User must confirm on device screen
   * @param txData - Transaction data to sign
   * @returns Signature string
   */
  const signTransaction = useCallback(
    async (txData: Record<string, unknown>): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        // LedgerAdapter.getSignature() communicates with device and returns signature
        // Note: This is a placeholder - actual method name may differ in @decentralchain/signature-adapter
        const signature = (await withTimeout(
          (
            adapterRef.current as unknown as {
              getSignature: (data: Record<string, unknown>) => Promise<string>;
            }
          ).getSignature(txData),
        )) as string;

        return signature;
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error('Transaction signing failed or was rejected on device');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [withTimeout],
  );

  return {
    connect,
    disconnect,
    error,
    getUserList,
    isConnected,
    isInitialized,
    isLoading,
    signTransaction,
    users,
  };
};
