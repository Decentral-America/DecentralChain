/**
 * Transaction Stream — real-time via the DCC ws-api.
 *
 * BPS publishes confirmed transactions to Redis under:
 *   topic://transactions?type=all&address={addr}
 *   topic://transactions?type={type_name}&address={addr}
 *
 * The ws-api's psubscribe("topic://*") delivers the raw tx JSON to every
 * client subscribed to that exact channel — the same architecture used by
 * the Waves Exchange.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '@/config';
import { useAuth } from '@/contexts';
import { useStateSubscription } from '@/hooks/useStateSubscription';

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

export interface TransactionStreamOptions {
  enabled?: boolean;
  filterTypes?: number[];
  minConfirmations?: number;
}

export const useTransactionStream = (
  onNewTransaction?: (tx: TransactionNotification) => void,
  options?: TransactionStreamOptions,
) => {
  const { user } = useAuth();
  const address = user?.address;
  const [transactions, setTransactions] = useState<TransactionNotification[]>([]);
  const [lastTransaction, setLastTransaction] = useState<TransactionNotification | null>(null);
  const [isListening, setIsListening] = useState(false);

  const seenIds = useRef(new Set<string>());
  const filterTypesRef = useRef(options?.filterTypes);
  filterTypesRef.current = options?.filterTypes;
  const minConfirmationsRef = useRef(options?.minConfirmations);
  minConfirmationsRef.current = options?.minConfirmations;
  const onNewTransactionRef = useRef(onNewTransaction);
  onNewTransactionRef.current = onNewTransaction;

  const handleUpdate = useCallback((_topic: string, value: string) => {
    try {
      const raw = JSON.parse(value) as Record<string, unknown>;
      const txId = raw.id as string | undefined;
      if (!txId || seenIds.current.has(txId)) return;

      const txType = raw.type as number;
      const appStatus = raw.applicationStatus as string | undefined;

      const rawRecipient = raw.recipient;
      const rawAmount = raw.amount;
      const rawAssetId = raw.assetId;
      const rawHeight = raw.height;

      const tx: TransactionNotification = {
        id: txId,
        sender: raw.sender as string,
        type: txType,
        ...(typeof rawRecipient === 'string' && { recipient: rawRecipient }),
        ...(typeof rawAmount === 'number' && { amount: rawAmount }),
        ...(rawAssetId !== undefined && { assetId: rawAssetId as string | null }),
        timestamp: raw.timestamp as number,
        ...(typeof rawHeight === 'number' && { height: rawHeight }),
        confirmations: 1,
        status: appStatus === 'failed' ? 'failed' : 'confirmed',
      };

      if (filterTypesRef.current && !filterTypesRef.current.includes(tx.type)) return;
      if (minConfirmationsRef.current && tx.confirmations < minConfirmationsRef.current) return;

      seenIds.current.add(txId);
      setLastTransaction(tx);
      onNewTransactionRef.current?.(tx);
      setTransactions((prev) => [tx, ...prev].slice(0, 50));
    } catch {
      // malformed value — ignore
    }
  }, []);

  const topic = address ? `topic://transactions?type=all&address=${address}` : undefined;

  const { isConnected } = useStateSubscription(
    address,
    handleUpdate,
    !!config.wsUrl && !!address && options?.enabled !== false,
    topic,
  );

  useEffect(() => {
    setIsListening(isConnected && !!address && options?.enabled !== false);
  }, [isConnected, address, options?.enabled]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: address is a trigger
  useEffect(() => {
    seenIds.current.clear();
    setTransactions([]);
    setLastTransaction(null);
  }, [address]);

  return { address, isListening, lastTransaction, transactions };
};

export const useIncomingTransactions = (onIncoming?: (tx: TransactionNotification) => void) => {
  const { user } = useAuth();
  const address = user?.address;

  const handleTransaction = useCallback(
    (tx: TransactionNotification) => {
      if (tx.recipient === address) onIncoming?.(tx);
    },
    [address, onIncoming],
  );

  return useTransactionStream(handleTransaction, { filterTypes: [4, 11] });
};

export const useOutgoingTransactions = (onOutgoing?: (tx: TransactionNotification) => void) => {
  const { user } = useAuth();
  const address = user?.address;

  const handleTransaction = useCallback(
    (tx: TransactionNotification) => {
      if (tx.sender === address) onOutgoing?.(tx);
    },
    [address, onOutgoing],
  );

  return useTransactionStream(handleTransaction);
};

export const useTransactionConfirmations = (transactionId: string, requiredConfirmations = 1) => {
  const [confirmations, setConfirmations] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleTransaction = useCallback(
    (tx: TransactionNotification) => {
      if (tx.id === transactionId) {
        setConfirmations(tx.confirmations);
        if (tx.confirmations >= requiredConfirmations) setIsConfirmed(true);
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

export const usePendingTransactions = () => {
  const [pendingTxs, setPendingTxs] = useState<TransactionNotification[]>([]);

  const handleTransaction = useCallback((tx: TransactionNotification) => {
    if (tx.status === 'pending' || tx.confirmations === 0) {
      setPendingTxs((prev) => (prev.some((t) => t.id === tx.id) ? prev : [tx, ...prev]));
    } else if (tx.status === 'confirmed') {
      setPendingTxs((prev) => prev.filter((t) => t.id !== tx.id));
    }
  }, []);

  const { isListening } = useTransactionStream(handleTransaction);
  return { isListening, pendingCount: pendingTxs.length, pendingTransactions: pendingTxs };
};

export const isIncomingTransaction = (tx: TransactionNotification, userAddress: string) =>
  tx.recipient === userAddress && tx.sender !== userAddress;

export const isOutgoingTransaction = (tx: TransactionNotification, userAddress: string) =>
  tx.sender === userAddress;

export const getTransactionDirection = (
  tx: TransactionNotification,
  userAddress: string,
): 'incoming' | 'outgoing' | 'self' | 'unknown' => {
  if (tx.sender === userAddress && tx.recipient === userAddress) return 'self';
  if (tx.recipient === userAddress) return 'incoming';
  if (tx.sender === userAddress) return 'outgoing';
  return 'unknown';
};

export const formatTransactionAmount = (
  tx: TransactionNotification,
  userAddress: string,
): string => {
  if (!tx.amount) return '0';
  const direction = getTransactionDirection(tx, userAddress);
  const amount = tx.amount / 100_000_000;
  return direction === 'incoming'
    ? `+${amount}`
    : direction === 'outgoing'
      ? `-${amount}`
      : `${amount}`;
};
