/**
 * Transaction Stream Hook
 * Real-time transaction notifications via WebSocket
 */
import { useCallback, useEffect, useState } from 'react';
import { config } from '@/config';
import { useAuth } from '@/contexts';
import { createWebSocketUrl, useWebSocketChannel } from '@/services/websocket';

/**
 * Transaction Notification
 */
export interface TransactionNotification {
  id: string;
  type: number;
  sender: string;
  recipient?: string;
  amount?: number;
  assetId?: string | null;
  timestamp: number;
  height?: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
}

/**
 * Transaction Stream Options
 */
export interface TransactionStreamOptions {
  enabled?: boolean;
  filterTypes?: number[]; // Transaction types to listen for
  minConfirmations?: number; // Minimum confirmations before notification
}

/**
 * Hook: useTransactionStream
 * Subscribe to real-time transaction notifications for current user
 *
 * @param onNewTransaction - Callback when new transaction received
 * @param options - Stream configuration options
 */
export const useTransactionStream = (
  onNewTransaction?: (tx: TransactionNotification) => void,
  options?: TransactionStreamOptions,
) => {
  const { user } = useAuth();
  const address = user?.address;

  const [transactions, setTransactions] = useState<TransactionNotification[]>([]);
  const [lastTransaction, setLastTransaction] = useState<TransactionNotification | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Create WebSocket URL from node URL
  const wsUrl = createWebSocketUrl(config.nodeUrl);

  // Build channel name for user address
  const channel = address ? `transactions:${address}` : '';

  // Handle incoming transactions
  const handleTransaction = useCallback(
    (data: TransactionNotification) => {
      // Filter by transaction types if specified
      if (options?.filterTypes && !options.filterTypes.includes(data.type)) {
        return;
      }

      // Filter by minimum confirmations if specified
      if (options?.minConfirmations && data.confirmations < options.minConfirmations) {
        return;
      }

      // Update state
      setLastTransaction(data);
      setTransactions((prev) => {
        // Add new transaction to the beginning
        const newTransactions = [data, ...prev];
        // Keep only last 50 transactions
        return newTransactions.slice(0, 50);
      });

      // Trigger callback
      onNewTransaction?.(data);
    },
    [onNewTransaction, options?.filterTypes, options?.minConfirmations],
  );

  // Subscribe to transaction channel
  useWebSocketChannel<TransactionNotification>(
    { debug: config.enableDebug, url: wsUrl },
    channel,
    handleTransaction,
    !!address && options?.enabled !== false,
  );

  // Update listening status
  useEffect(() => {
    setIsListening(!!address && options?.enabled !== false);
  }, [address, options?.enabled]);

  // Reset state when address changes
  useEffect(() => {
    setTransactions([]);
    setLastTransaction(null);
  }, []);

  return {
    address,
    isListening,
    lastTransaction,
    transactions,
  };
};

/**
 * Hook: useIncomingTransactions
 * Specialized hook for incoming (received) transactions only
 *
 * @param onIncoming - Callback for incoming transactions
 */
export const useIncomingTransactions = (onIncoming?: (tx: TransactionNotification) => void) => {
  const { user } = useAuth();
  const address = user?.address;

  const handleTransaction = useCallback(
    (tx: TransactionNotification) => {
      // Only process if user is recipient
      if (tx.recipient === address) {
        onIncoming?.(tx);
      }
    },
    [address, onIncoming],
  );

  return useTransactionStream(handleTransaction, {
    // Filter for transfer transaction types (4 = Transfer, 11 = MassTransfer)
    filterTypes: [4, 11],
  });
};

/**
 * Hook: useOutgoingTransactions
 * Specialized hook for outgoing (sent) transactions only
 *
 * @param onOutgoing - Callback for outgoing transactions
 */
export const useOutgoingTransactions = (onOutgoing?: (tx: TransactionNotification) => void) => {
  const { user } = useAuth();
  const address = user?.address;

  const handleTransaction = useCallback(
    (tx: TransactionNotification) => {
      // Only process if user is sender
      if (tx.sender === address) {
        onOutgoing?.(tx);
      }
    },
    [address, onOutgoing],
  );

  return useTransactionStream(handleTransaction);
};

/**
 * Hook: useTransactionConfirmations
 * Track confirmation progress for a specific transaction
 *
 * @param transactionId - Transaction ID to track
 * @param requiredConfirmations - Number of confirmations needed
 */
export const useTransactionConfirmations = (transactionId: string, requiredConfirmations = 1) => {
  const [confirmations, setConfirmations] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleTransaction = useCallback(
    (tx: TransactionNotification) => {
      if (tx.id === transactionId) {
        setConfirmations(tx.confirmations);
        if (tx.confirmations >= requiredConfirmations) {
          setIsConfirmed(true);
        }
      }
    },
    [transactionId, requiredConfirmations],
  );

  useTransactionStream(handleTransaction);

  return {
    confirmations,
    isConfirmed,
    progress: requiredConfirmations > 0 ? confirmations / requiredConfirmations : 0,
  };
};

/**
 * Hook: usePendingTransactions
 * Track all pending (unconfirmed) transactions for current user
 */
export const usePendingTransactions = () => {
  const [pendingTxs, setPendingTxs] = useState<TransactionNotification[]>([]);

  const handleTransaction = useCallback((tx: TransactionNotification) => {
    if (tx.status === 'pending' || tx.confirmations === 0) {
      // Add to pending list
      setPendingTxs((prev) => {
        const exists = prev.some((t) => t.id === tx.id);
        if (!exists) {
          return [tx, ...prev];
        }
        return prev;
      });
    } else if (tx.status === 'confirmed') {
      // Remove from pending list
      setPendingTxs((prev) => prev.filter((t) => t.id !== tx.id));
    }
  }, []);

  const { isListening } = useTransactionStream(handleTransaction);

  return {
    isListening,
    pendingCount: pendingTxs.length,
    pendingTransactions: pendingTxs,
  };
};

/**
 * Utility: Check if transaction is incoming
 * @param tx - Transaction notification
 * @param userAddress - User's address
 */
export const isIncomingTransaction = (
  tx: TransactionNotification,
  userAddress: string,
): boolean => {
  return tx.recipient === userAddress && tx.sender !== userAddress;
};

/**
 * Utility: Check if transaction is outgoing
 * @param tx - Transaction notification
 * @param userAddress - User's address
 */
export const isOutgoingTransaction = (
  tx: TransactionNotification,
  userAddress: string,
): boolean => {
  return tx.sender === userAddress;
};

/**
 * Utility: Get transaction direction
 * @param tx - Transaction notification
 * @param userAddress - User's address
 */
export const getTransactionDirection = (
  tx: TransactionNotification,
  userAddress: string,
): 'incoming' | 'outgoing' | 'self' | 'unknown' => {
  if (tx.sender === userAddress && tx.recipient === userAddress) {
    return 'self';
  }
  if (tx.recipient === userAddress) {
    return 'incoming';
  }
  if (tx.sender === userAddress) {
    return 'outgoing';
  }
  return 'unknown';
};

/**
 * Utility: Format transaction amount with direction
 * @param tx - Transaction notification
 * @param userAddress - User's address
 */
export const formatTransactionAmount = (
  tx: TransactionNotification,
  userAddress: string,
): string => {
  if (!tx.amount) return '0';

  const direction = getTransactionDirection(tx, userAddress);
  const amount = tx.amount / 100000000; // Convert from wavelets

  switch (direction) {
    case 'incoming':
      return `+${amount}`;
    case 'outgoing':
      return `-${amount}`;
    case 'self':
      return `${amount}`;
    default:
      return `${amount}`;
  }
};
