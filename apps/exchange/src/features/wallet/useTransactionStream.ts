/**
 * Transaction Stream — HTTP polling against the node REST API.
 *
 * The DCC node exposes `/transactions/address/{addr}/limit/{n}` for history
 * but no WebSocket endpoint for real-time streaming. This module implements
 * efficient polling: the first fetch seeds the "already seen" set so old
 * transactions never trigger callbacks; subsequent polls detect additions.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '@/config';
import { useAuth } from '@/contexts';

const POLL_INTERVAL_MS = 15_000;
const TX_LIMIT = 20;

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

interface NodeTx {
  id: string;
  type: number;
  sender: string;
  recipient?: string;
  amount?: number;
  assetId?: string | null;
  timestamp: number;
  height?: number;
  applicationStatus?: string;
}

async function fetchHeight(nodeUrl: string): Promise<number> {
  const res = await fetch(`${nodeUrl}/blocks/height`);
  if (!res.ok) return 0;
  const data = (await res.json()) as { height: number };
  return data.height ?? 0;
}

async function fetchTransactions(
  nodeUrl: string,
  address: string,
): Promise<TransactionNotification[]> {
  const [txRes, height] = await Promise.all([
    fetch(`${nodeUrl}/transactions/address/${address}/limit/${TX_LIMIT}`),
    fetchHeight(nodeUrl),
  ]);
  if (!txRes.ok) return [];
  const pages = (await txRes.json()) as NodeTx[][];
  const txs = pages[0] ?? [];
  return txs.map((tx): TransactionNotification => {
    const txHeight = tx.height ?? 0;
    const confirmations = height > 0 && txHeight > 0 ? height - txHeight : 0;
    return {
      id: tx.id,
      sender: tx.sender,
      type: tx.type,
      ...(tx.recipient !== undefined && { recipient: tx.recipient }),
      ...(tx.amount !== undefined && { amount: tx.amount }),
      ...(tx.assetId !== undefined && { assetId: tx.assetId }),
      confirmations,
      height: txHeight,
      status:
        tx.applicationStatus === 'failed' ? 'failed' : confirmations >= 1 ? 'confirmed' : 'pending',
      timestamp: tx.timestamp,
    };
  });
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
  const onNewTransactionRef = useRef(onNewTransaction);
  onNewTransactionRef.current = onNewTransaction;
  const filterTypesRef = useRef(options?.filterTypes);
  filterTypesRef.current = options?.filterTypes;
  const minConfirmationsRef = useRef(options?.minConfirmations);
  minConfirmationsRef.current = options?.minConfirmations;

  const processNewTransactions = useCallback((fetched: TransactionNotification[]) => {
    const fresh = fetched.filter((tx) => {
      if (seenIds.current.has(tx.id)) return false;
      if (filterTypesRef.current && !filterTypesRef.current.includes(tx.type)) return false;
      if (minConfirmationsRef.current && tx.confirmations < minConfirmationsRef.current)
        return false;
      return true;
    });
    if (fresh.length === 0) return;

    for (const tx of fresh) seenIds.current.add(tx.id);
    setLastTransaction(fresh[0] ?? null);
    for (const tx of fresh) onNewTransactionRef.current?.(tx);
    setTransactions((prev) => [...fresh, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    if (!address || options?.enabled === false) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const nodeUrl = config.nodeUrl;

    const poll = async () => {
      if (cancelled) return;
      try {
        const txs = await fetchTransactions(nodeUrl, address);
        if (!cancelled) processNewTransactions(txs);
      } catch {
        // silent — network hiccup, will retry next interval
      }
      if (!cancelled) timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
    };

    // Seed seen IDs from the initial fetch so existing transactions never fire callbacks.
    fetchTransactions(nodeUrl, address)
      .then((txs) => {
        if (cancelled) return;
        for (const tx of txs) seenIds.current.add(tx.id);
        setTransactions(txs);
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      })
      .catch(() => {
        if (!cancelled) timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      setIsListening(false);
    };
  }, [address, options?.enabled, processNewTransactions]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: address is a trigger, not a consumed value
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
