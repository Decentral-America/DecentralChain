import { useCallback, useEffect, useState } from 'react';

export interface FaucetEntry {
  txId: string;
  address: string;
  amount: number;
}

const STORAGE_KEY = 'dcc_faucet_history';
const MAX_ENTRIES = 20;

function loadHistory(): FaucetEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FaucetEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: FaucetEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage unavailable (SSR or private mode)
  }
}

export function useFaucetHistory(): {
  history: FaucetEntry[];
  addEntry: (entry: FaucetEntry) => void;
  isLoading: boolean;
} {
  const [history, setHistory] = useState<FaucetEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHistory(loadHistory());
    setIsLoading(false);
  }, []);

  const addEntry = useCallback((entry: FaucetEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      saveHistory(next);
      return next;
    });
  }, []);

  return { addEntry, history, isLoading };
}
