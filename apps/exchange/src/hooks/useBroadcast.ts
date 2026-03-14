import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { transactionService } from '@/services/transactionService';

/**
 * Transaction type (any - matches waves-transactions)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Transaction = any;

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
  confirmations: number = 1,
  timeout: number = 60000,
  debug: boolean = false
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

        if (tx && tx.height) {
          // Transaction confirmed
          if (debug) {
            console.log(`[Broadcast] Transaction confirmed: ${txId} at height ${tx.height}`);
          }
          resolve({ height: tx.height });
        } else {
          // Not confirmed yet, check again
          setTimeout(checkTx, checkInterval);
        }
      } catch (error) {
        if (debug) {
          console.log(`[Broadcast] Checking tx ${txId}:`, error);
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
 *   onSuccess: (result) => console.log('Transaction ID:', result.id),
 *   onError: (error) => console.error('Broadcast failed:', error),
 * });
 *
 * broadcast(signedTransaction);
 *
 * @example
 * // Wait for confirmation
 * const { broadcastAsync } = useBroadcast({
 *   waitForConfirmation: true,
 *   confirmations: 3,
 *   onConfirmed: (result) => console.log('Confirmed at height:', result.height),
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

  const mutation = useMutation<BroadcastResult, Error, Transaction>({
    mutationFn: async (transaction: Transaction): Promise<BroadcastResult> => {
      setStatus('pending');

      if (debug) {
        console.log('[Broadcast] Broadcasting transaction:', transaction);
      }

      try {
        // Broadcast transaction to blockchain
        const response = await transactionService.broadcast(transaction);

        const broadcastResult: BroadcastResult = {
          id: response.id,
          transaction,
          timestamp: Date.now(),
        };

        setResult(broadcastResult);
        setStatus(waitForConfirmation ? 'confirming' : 'confirmed');

        if (showToast) {
          toast.showSuccess(`Transaction broadcast: ${response.id.slice(0, 8)}...`);
        }

        if (debug) {
          console.log('[Broadcast] Transaction broadcast successful:', response.id);
        }

        // Invalidate balance queries to trigger refresh
        if (user?.address) {
          // Wait a short moment for the transaction to be indexed
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['addressBalance', user.address] });
            if (debug) {
              console.log('[Broadcast] Balance queries invalidated for address:', user.address);
            }
          }, 2000); // 2 second delay to allow blockchain indexing
        }

        // Wait for confirmation if requested
        if (waitForConfirmation && !confirmationAbortRef.current) {
          if (debug) {
            console.log(`[Broadcast] Waiting for ${confirmations} confirmation(s)...`);
          }

          const confirmationResult = await waitForTxConfirmation(
            response.id,
            confirmations,
            confirmationTimeout,
            debug
          );

          broadcastResult.height = confirmationResult.height;
          setResult(broadcastResult);
          setStatus('confirmed');

          onConfirmed?.(broadcastResult);

          if (showToast) {
            toast.showSuccess(`Transaction confirmed at height ${confirmationResult.height}`);
          }

          if (debug) {
            console.log(`[Broadcast] Transaction confirmed at height ${confirmationResult.height}`);
          }

          // Invalidate balance again after confirmation for final update
          if (user?.address) {
            queryClient.invalidateQueries({ queryKey: ['addressBalance', user.address] });
            if (debug) {
              console.log('[Broadcast] Balance queries invalidated after confirmation');
            }
          }
        }

        return broadcastResult;
      } catch (error) {
        setStatus('failed');
        const err = error instanceof Error ? error : new Error(String(error));

        if (showToast) {
          toast.showError(`Broadcast failed: ${err.message}`);
        }

        if (debug) {
          console.error('[Broadcast] Broadcast failed:', err);
        }

        throw err;
      }
    },
    onSuccess: (result: BroadcastResult) => {
      onSuccess?.(result);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
    retry: retryCount,
    retryDelay: retryDelay,
  });

  const broadcast = useCallback(
    (transaction: Transaction) => {
      confirmationAbortRef.current = false;
      mutation.mutate(transaction);
    },
    [mutation]
  );

  const broadcastAsync = useCallback(
    async (transaction: Transaction): Promise<BroadcastResult> => {
      confirmationAbortRef.current = false;
      return mutation.mutateAsync(transaction);
    },
    [mutation]
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
      console.log('[Broadcast] Confirmation wait cancelled');
    }
  }, [debug]);

  return {
    broadcast,
    broadcastAsync,
    status,
    isLoading: mutation.isPending,
    isConfirming: status === 'confirming',
    error: mutation.error,
    txId: result?.id || null,
    result,
    reset,
    cancelConfirmation,
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
 *   onConfirmed: (result) => console.log('Confirmed!', result),
 * });
 *
 * const result = await broadcastAsync(signedTransaction);
 */
export const useBroadcastWithConfirmation = (
  options: Omit<UseBroadcastOptions, 'waitForConfirmation'> = {}
) => {
  return useBroadcast({ ...options, waitForConfirmation: true });
};

/**
 * Utility variant: useBatchBroadcast
 * Hook for broadcasting multiple transactions sequentially
 *
 * @example
 * const { broadcastBatch, isLoading, results } = useBatchBroadcast({
 *   onBatchComplete: (results) => console.log('All broadcast:', results),
 * });
 *
 * broadcastBatch([tx1, tx2, tx3]);
 */
export const useBatchBroadcast = (
  options: {
    onBatchComplete?: (results: BroadcastResult[]) => void;
    onBatchError?: (error: Error, index: number) => void;
    debug?: boolean;
  } = {}
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
            transaction: transactions[i],
            timestamp: Date.now(),
          };
          batchResults.push(result);

          if (debug) {
            console.log(
              `[BatchBroadcast] Transaction ${i + 1}/${transactions.length} broadcast:`,
              response.id
            );
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          batchErrors.push({ index: i, error: err });
          onBatchError?.(err, i);

          if (debug) {
            console.error(
              `[BatchBroadcast] Transaction ${i + 1}/${transactions.length} failed:`,
              err
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

      return { results: batchResults, errors: batchErrors };
    },
    [debug, onBatchComplete, onBatchError]
  );

  return {
    broadcastBatch,
    isLoading,
    results,
    errors,
  };
};

/**
 * Export types for external usage
 */
export type { BroadcastStatus, BroadcastResult, UseBroadcastOptions, UseBroadcastReturn };
