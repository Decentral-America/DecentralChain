/**
 * Indexer reads.
 *
 * Everything here is historical or cross-pool — the figures a blockchain
 * cannot answer directly. Poll intervals are generous because the indexer is
 * rate limited and none of this changes per second.
 */
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import {
  fetchAllPoolStats,
  fetchIndexedPools,
  fetchProtocolStatus,
  fetchSwaps,
  type IndexedPool,
  type IndexedSwap,
  type PoolStats,
  type ProtocolStatus,
} from '@/services/amm/indexer';

const POLL_MS = 30_000;

export const useIndexedPools = (): UseQueryResult<IndexedPool[], Error> =>
  useQuery({
    queryFn: fetchIndexedPools,
    queryKey: ['amm-indexer', 'pools'],
    refetchInterval: POLL_MS,
    staleTime: POLL_MS,
  });

export const usePoolStats = (poolKeys: string[]): UseQueryResult<Map<string, PoolStats>, Error> =>
  useQuery({
    enabled: poolKeys.length > 0,
    queryFn: () => fetchAllPoolStats(poolKeys),
    queryKey: ['amm-indexer', 'pool-stats', ...poolKeys],
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

export const useRecentSwaps = (
  limit = 25,
  poolKey?: string,
): UseQueryResult<IndexedSwap[], Error> =>
  useQuery({
    queryFn: () => fetchSwaps(limit, poolKey),
    queryKey: ['amm-indexer', 'swaps', limit, poolKey ?? 'all'],
    refetchInterval: POLL_MS,
  });

export const useProtocolStatus = (): UseQueryResult<ProtocolStatus, Error> =>
  useQuery({
    queryFn: fetchProtocolStatus,
    queryKey: ['amm-indexer', 'status'],
    refetchInterval: POLL_MS,
  });
