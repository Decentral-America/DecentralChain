import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { logger } from '@/lib/logger';
import { transactionService } from '@/services/transactionService';

/**
 * Transaction type — opaque signed transaction payload
 */
export type Transaction = unknown;

/**
 * Transaction broadcast status
 */
type BroadcastStatus = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'failed';

/**
 * Broadcast result with transaction details
 */
interface BroadcastResult {
  /**
   * Transaction ID returned from blockchain
   */
  id: string;

  /**
   * Transaction height (when confirmed)
   */
  height?: number;

  /**
   * Original transaction data
   */
  transaction: Transaction;

  /**
   * Timestamp when broadcast occurred
   */
  timestamp: number;
}

/**
 * Options for useBroadcast hook
 */
interface UseBroadcastOptions {
  /**
   * Callback when broadcast succeeds
   */
  onSuccess?: (result: BroadcastResult) => void;

  /**
   * Callback when broadcast fails
   */
  onError?: (error: Error) => void;

  /**
   * Callback when transaction is confirmed on chain
   */
  onConfirmed?: (result: BroadcastResult) => void;

  /**
   * Wait for transaction confirmation
   * @default false
   */
  waitForConfirmation?: boolean;

  /**
   * Number of confirmations to wait for
   * @default 1
   */
  confirmations?: number;

  /**
   * Timeout for confirmation waiting (milliseconds)
   * @default 60000 (60 seconds)
   */
  confirmationTimeout?: number;

  /**
   * Show toast notifications
   * @default true
   */
  showToast?: boolean;

  /**
   * Enable development logging
   * @default true in development mode
   */
  debug?: boolean;

  /**
   * Retry failed broadcasts
   * @default 0
   */
  retryCount?: number;

  /**
   * Retry delay in milliseconds
   * @default 1000
   */
  retryDelay?: number;
}

/**
 * Broadcast hook return type
 */
interface UseBroadcastReturn {
  /**
   * Broadcast a signed transaction
   */
  broadcast: (transaction: Transaction) => void;

  /**
   * Broadcast transaction and return promise
   */
  broadcastAsync: (transaction: Transaction) => Promise<BroadcastResult>;

  /**
   * Current broadcast status
   */
  status: BroadcastStatus;

  /**
   * Whether broadcast is in progress
   */
  isLoading: boolean;

  /**
   * Whether waiting for confirmation
   */
  isConfirming: boolean;

  /**
   * Error that occurred during broadcast
   */
  error: Error | null;

  /**
   * Transaction ID (null if not broadcast yet)
   */
  txId: string | null;

  /**
   * Full broadcast result (null if not broadcast yet)
   */
  result: BroadcastResult | null;

  /**
   * Reset hook state to idle
   */
  reset: () => void;

  /**
   * Cancel ongoing confirmation wait
   */
  cancelConfirmation: () => void;
}

/**
 * Wait for transaction confirmation on blockchain
 */
const waitForTxConfirmation = async (
  txId: string,
  _confirmations: number = 1,
  timeout: number = 60000,
  debug: boolean = false,
): Promise<{ height: number }> => {
  const startTime = Date.now();
  const checkInterval = 3000; // Check every 3 seconds

  return new Promise((resolve, reject) => {
    const checkTx = async () => {
      try {
        // Check if timeout exceeded
        if (Date.now() - startTime > timeout) {
          reject(new Error('Transaction confirmation timeout'));
          return;
        }

        // Query transaction status
        const tx = await transactionService.getById(txId);

        if (tx?.height) {
          // Transaction confirmed
          if (debug) {
            logger.debug(`[Broadcast] Transaction confirmed: ${txId} at height ${tx.height}`);
          }
          resolve({ height: tx.height });
        } else {
          // Not confirmed yet, check again
          setTimeout(checkTx, checkInterval);
        }
      } catch (error) {
        if (debug) {
          logger.debug(`[Broadcast] Checking tx ${txId}:`, error);
        }
        // Continue checking (tx might not be in mempool yet)
        setTimeout(checkTx, checkInterval);
      }
    };

    // Start checking
    setTimeout(checkTx, checkInterval);
  });
};

/**
 * Custom hook for broadcasting transactions to blockchain
 *
 * Provides functionality to broadcast signed transactions, wait for
 * confirmations, and handle errors. Integrates with React Query for
 * caching and automatic retries.
 *
 * @param options - Configuration options
 * @returns Broadcast control object
 *
 * @example
 * // Basic broadcast
 * const { broadcast, isLoading, txId } = useBroadcast({
 *   onSuccess: (result) => logger.debug('Transaction ID:', result.id),
 *   onError: (error) => logger.error('Broadcast failed:', error),
 * });
 *
 * broadcast(signedTransaction);
 *
 * @example
 * // Wait for confirmation
 * const { broadcastAsync } = useBroadcast({
 *   waitForConfirmation: true,
 *   confirmations: 3,
 *   onConfirmed: (result) => logger.debug('Confirmed at height:', result.height),
 * });
 *
 * const result = await broadcastAsync(signedTransaction);
 */
export const useBroadcast = (options: UseBroadcastOptions = {}): UseBroadcastReturn => {
  const {
    onSuccess,
    onError,
    onConfirmed,
    waitForConfirmation = false,
    confirmations = 1,
    confirmationTimeout = 60000,
    showToast = true,
    debug = import.meta.env.DEV,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [status, setStatus] = useState<BroadcastStatus>('idle');
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const confirmationAbortRef = useRef<boolean>(false);
  const broadcastInFlightRef = useRef<boolean>(false);

  const invalidateBalanceQueries = useCallback(
    (address: string | undefined) => {
      if (!address) return;
      queryClient.invalidateQueries({ queryKey: ['addressBalance', address] });
      if (debug) logger.debug('[Broadcast] Balance queries invalidated for address:', address);
    },
    [queryClient, debug],
  );

  const debugLog = useCallback(
    (msg: string, ...args: unknown[]) => {
      if (debug) logger.debug(msg, ...args);
    },
    [debug],
  );

  const notify = useCallback(
    (type: 'success' | 'error', msg: string) => {
      if (showToast) toast[type === 'success' ? 'showSuccess' : 'showError'](msg);
    },
    [showToast, toast],
  );

  const mutation = useMutation<BroadcastResult, Error, Transaction>({
    mutationFn: async (transaction: Transaction): Promise<BroadcastResult> => {
      if (broadcastInFlightRef.current) {
        throw new Error('A transaction broadcast is already in progress. Please wait.');
      }
      broadcastInFlightRef.current = true;
      setStatus('pending');
      debugLog('[Broadcast] Broadcasting transaction:', transaction);

      try {
        const response = await transactionService.broadcast(transaction);
        const broadcastResult: BroadcastResult = {
          id: response.id,
          timestamp: Date.now(),
          transaction,
        };

        setResult(broadcastResult);
        setStatus(waitForConfirmation ? 'confirming' : 'confirmed');
        notify('success', `Transaction broadcast: ${response.id.slice(0, 8)}...`);
        debugLog('[Broadcast] Transaction broadcast successful:', response.id);

        if (user?.address) setTimeout(() => invalidateBalanceQueries(user.address), 2000);

        if (waitForConfirmation && !confirmationAbortRef.current) {
          debugLog(`[Broadcast] Waiting for ${confirmations} confirmation(s)...`);
          const confirmationResult = await waitForTxConfirmation(
            response.id,
            confirmations,
            confirmationTimeout,
            debug,
          );
          broadcastResult.height = confirmationResult.height;
          setResult(broadcastResult);
          setStatus('confirmed');
          onConfirmed?.(broadcastResult);
          notify('success', `Transaction confirmed at height ${confirmationResult.height}`);
          invalidateBalanceQueries(user?.address);
        }

        return broadcastResult;
      } catch (error) {
        setStatus('failed');
        const err = error instanceof Error ? error : new Error(String(error));
        notify('error', `Broadcast failed: ${err.message}`);
        debugLog('[Broadcast] Broadcast failed:', err);
        throw err;
      } finally {
        broadcastInFlightRef.current = false;
      }
    },
    onError: (error: Error) => {
      onError?.(error);
    },
    onSuccess: (result: BroadcastResult) => {
      onSuccess?.(result);
    },
    retry: retryCount,
    retryDelay: retryDelay,
  });

  const broadcast = useCallback(
    (transaction: Transaction) => {
      confirmationAbortRef.current = false;
      mutation.mutate(transaction);
    },
    [mutation],
  );

  const broadcastAsync = useCallback(
    async (transaction: Transaction): Promise<BroadcastResult> => {
      confirmationAbortRef.current = false;
      return mutation.mutateAsync(transaction);
    },
    [mutation],
  );

  const reset = useCallback(() => {
    mutation.reset();
    setStatus('idle');
    setResult(null);
    confirmationAbortRef.current = false;
  }, [mutation]);

  const cancelConfirmation = useCallback(() => {
    confirmationAbortRef.current = true;
    setStatus('confirmed'); // Mark as confirmed even if cancelled
    if (debug) {
      logger.debug('[Broadcast] Confirmation wait cancelled');
    }
  }, [debug]);

  return {
    broadcast,
    broadcastAsync,
    cancelConfirmation,
    error: mutation.error,
    isConfirming: status === 'confirming',
    isLoading: mutation.isPending,
    reset,
    result,
    status,
    txId: result?.id || null,
  };
};

/**
 * Utility variant: useBroadcastWithToast
 * Simplified hook with automatic toast notifications
 *
 * @example
 * const { broadcast, isLoading } = useBroadcastWithToast();
 * broadcast(signedTransaction);
 */
export const useBroadcastWithToast = (options: Omit<UseBroadcastOptions, 'showToast'> = {}) => {
  return useBroadcast({ ...options, showToast: true });
};

/**
 * Utility variant: useBroadcastWithConfirmation
 * Hook that always waits for transaction confirmation
 *
 * @example
 * const { broadcastAsync } = useBroadcastWithConfirmation({
 *   confirmations: 3,
 *   onConfirmed: (result) => logger.debug('Confirmed!', result),
 * });
 *
 * const result = await broadcastAsync(signedTransaction);
 */
export const useBroadcastWithConfirmation = (
  options: Omit<UseBroadcastOptions, 'waitForConfirmation'> = {},
) => {
  return useBroadcast({ ...options, waitForConfirmation: true });
};

/**
 * Utility variant: useBatchBroadcast
 * Hook for broadcasting multiple transactions sequentially
 *
 * @example
 * const { broadcastBatch, isLoading, results } = useBatchBroadcast({
 *   onBatchComplete: (results) => logger.debug('All broadcast:', results),
 * });
 *
 * broadcastBatch([tx1, tx2, tx3]);
 */
export const useBatchBroadcast = (
  options: {
    onBatchComplete?: (results: BroadcastResult[]) => void;
    onBatchError?: (error: Error, index: number) => void;
    debug?: boolean;
  } = {},
) => {
  const { onBatchComplete, onBatchError, debug = import.meta.env.DEV } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BroadcastResult[]>([]);
  const [errors, setErrors] = useState<Array<{ index: number; error: Error }>>([]);

  const broadcastBatch = useCallback(
    async (transactions: Transaction[]) => {
      setIsLoading(true);
      setResults([]);
      setErrors([]);

      const batchResults: BroadcastResult[] = [];
      const batchErrors: Array<{ index: number; error: Error }> = [];

      for (let i = 0; i < transactions.length; i++) {
        try {
          const response = await transactionService.broadcast(transactions[i]);
          const result: BroadcastResult = {
            id: response.id,
            timestamp: Date.now(),
            transaction: transactions[i],
          };
          batchResults.push(result);

          if (debug) {
            logger.debug(
              `[BatchBroadcast] Transaction ${i + 1}/${transactions.length} broadcast:`,
              response.id,
            );
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          batchErrors.push({ error: err, index: i });
          onBatchError?.(err, i);

          if (debug) {
            logger.error(
              `[BatchBroadcast] Transaction ${i + 1}/${transactions.length} failed:`,
              err,
            );
          }
        }
      }

      setResults(batchResults);
      setErrors(batchErrors);
      setIsLoading(false);

      if (batchErrors.length === 0) {
        onBatchComplete?.(batchResults);
      }

      return { errors: batchErrors, results: batchResults };
    },
    [debug, onBatchComplete, onBatchError],
  );

  return {
    broadcastBatch,
    errors,
    isLoading,
    results,
  };
};

/**
 * Export types for external usage
 */
export type { BroadcastResult, BroadcastStatus, UseBroadcastOptions, UseBroadcastReturn };
