/**
 * useBridgeStats Hook
 * Vault health, and whether the bridge is accepting anything at all.
 */
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { getStats } from '@/services/bridge/api';
import { type BridgeStats } from '@/services/bridge/types';

const STALE_MS = 30_000;

export const bridgeStatsQueryKey = ['bridge', 'stats'] as const;

export const useBridgeStats = (): UseQueryResult<BridgeStats, Error> =>
  useQuery({
    queryFn: getStats,
    queryKey: bridgeStatsQueryKey,
    refetchInterval: STALE_MS,
    staleTime: STALE_MS,
  });
