/**
 * usePendingTransfers Hook
 * Keeps in-flight transfers across a page refresh.
 *
 * A deposit's transfer id is derived client-side and is the only handle on
 * that deposit's settlement. Holding it in component state means a refresh —
 * or a navigation away while waiting the ~75 seconds a mint takes — loses the
 * ability to say what happened to money that has already left the user's
 * wallet. Withdrawals take minutes, so the window is wider still.
 */
import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

const STORAGE_KEY = 'bridge.pendingTransfers';

/** Entries older than this are dropped: settled long ago, or never will. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface PendingTransfer {
  /** Human-readable amount, for display without refetching the token list. */
  amount: string;
  /**
   * 'deposit' locks on Solana; 'withdraw' burns on DecentralChain.
   *
   * This decides what `id` means and how it can be followed. A deposit's id is
   * the hex transfer id the client derived and submitted, which
   * `GET /transfer/:id` understands. A withdrawal's is a DecentralChain
   * transaction id — base58, from the burn — and that endpoint has no notion
   * of it. Polling one with the other returns the unknown-placeholder forever.
   */
  direction: 'deposit' | 'withdraw';
  /** Hex bridge transfer id for a deposit; base58 DCC burn tx id for a withdrawal. */
  id: string;
  startedAt: number;
  tokenName: string;
}

const read = (): PendingTransfer[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as PendingTransfer[];
    if (!Array.isArray(parsed)) return [];

    const cutoff = Date.now() - MAX_AGE_MS;
    return parsed.filter((entry) => entry.startedAt > cutoff);
  } catch (error) {
    // Corrupt storage must not take down the bridge page.
    logger.warn('[bridge] Could not read pending transfers', error);
    return [];
  }
};

const write = (transfers: PendingTransfer[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transfers));
  } catch (error) {
    logger.warn('[bridge] Could not persist pending transfers', error);
  }
};

export interface UsePendingTransfersReturn {
  add: (transfer: PendingTransfer) => void;
  remove: (id: string) => void;
  transfers: PendingTransfer[];
}

export const usePendingTransfers = (): UsePendingTransfersReturn => {
  const [transfers, setTransfers] = useState<PendingTransfer[]>([]);

  // Read on mount rather than in useState's initialiser: localStorage is
  // unavailable during SSR and in some privacy modes, and throwing here would
  // take the whole page with it.
  useEffect(() => {
    setTransfers(read());
  }, []);

  const add = useCallback((transfer: PendingTransfer) => {
    setTransfers((current) => {
      const next = [transfer, ...current.filter((entry) => entry.id !== transfer.id)];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setTransfers((current) => {
      const next = current.filter((entry) => entry.id !== id);
      write(next);
      return next;
    });
  }, []);

  return { add, remove, transfers };
};
