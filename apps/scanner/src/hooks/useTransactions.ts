import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import {
  fetchAddressTransactions,
  fetchTransactionInfo,
  fetchUnconfirmedTransactionInfo,
  fetchUnconfirmedTransactions,
} from '@/lib/api';
import { type Transaction } from '@/types';

/**
 * Fetch a transaction by ID, trying the confirmed pool first then the unconfirmed pool.
 * Returns null when the ID is empty or the transaction is not found on either endpoint.
 */
export function useTransaction(id: string | null): UseQueryResult<Transaction | null> {
  return useQuery({
    enabled: !!id,
    queryFn: async (): Promise<Transaction | null> => {
      if (!id) return null;
      try {
        const confirmed = await fetchTransactionInfo(id);
        if (confirmed) return confirmed as unknown as Transaction;
      } catch {
        /* fall through to unconfirmed */
      }
      try {
        const unconfirmed = await fetchUnconfirmedTransactionInfo(id);
        if (unconfirmed) return unconfirmed as unknown as Transaction;
      } catch {
        /* not found in either pool */
      }
      return null;
    },
    queryKey: ['transaction', id],
    staleTime: 2_000,
  });
}

/** Fetch recent transactions for an address (default: last 50). */
export function useAddressTransactions(
  address: string | null,
  limit = 50,
): UseQueryResult<Transaction[]> {
  return useQuery({
    enabled: !!address,
    queryFn: () => {
      if (!address) throw new Error('address is required');
      return fetchAddressTransactions(address, limit) as Promise<Transaction[]>;
    },
    queryKey: ['addressTransactions', address, limit],
    staleTime: 10_000,
  });
}

/** Fetch all currently unconfirmed transactions, polling every 5 s. */
export function useUnconfirmedTransactions(): UseQueryResult<Transaction[]> {
  return useQuery({
    queryFn: () => fetchUnconfirmedTransactions() as Promise<Transaction[]>,
    queryKey: ['unconfirmedTransactions'],
    refetchInterval: 5_000,
    staleTime: 4_000,
  });
}
