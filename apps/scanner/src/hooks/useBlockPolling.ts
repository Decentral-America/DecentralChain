import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { fetchHeight, fetchLastBlock, type IBlock } from '@/lib/api';

const POLL_INTERVAL = 5_000; // 5 seconds

/**
 * Shared hook for real-time block height polling.
 * All consumers share the same React Query cache entry.
 */
export function useBlockHeight(enabled = true): UseQueryResult<{ height: number }> {
  return useQuery({
    queryKey: ['height'],
    queryFn: () => fetchHeight(),
    refetchInterval: enabled ? POLL_INTERVAL : false,
    staleTime: POLL_INTERVAL - 1_000,
  });
}

/**
 * Shared hook for real-time latest block polling.
 */
export function useLatestBlock(enabled = true): UseQueryResult<IBlock> {
  return useQuery({
    queryKey: ['lastBlock'],
    queryFn: () => fetchLastBlock(),
    refetchInterval: enabled ? POLL_INTERVAL : false,
    staleTime: POLL_INTERVAL - 1_000,
  });
}
