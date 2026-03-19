import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import {
  fetchAllPeers,
  fetchBlacklistedPeers,
  fetchConnectedPeers,
  fetchSuspendedPeers,
  type IAllConnectedResponse,
  type IAllResponse,
  type IBlackPeer,
  type ISuspendedPeer,
} from '@/lib/api';

const STALE = 30_000;
const INTERVAL = 30_000;

/** Stream of currently connected peers, re-fetched every 30 s. */
export function useConnectedPeers(): UseQueryResult<IAllConnectedResponse> {
  return useQuery({
    queryFn: () => fetchConnectedPeers(),
    queryKey: ['peers', 'connected'],
    refetchInterval: INTERVAL,
    staleTime: STALE,
  });
}

/** Full peer list (known peers, not necessarily connected). */
export function useAllPeers(): UseQueryResult<IAllResponse> {
  return useQuery({
    queryFn: () => fetchAllPeers(),
    queryKey: ['peers', 'all'],
    staleTime: STALE,
  });
}

/** List of currently suspended peers. */
export function useSuspendedPeers(): UseQueryResult<ISuspendedPeer[]> {
  return useQuery({
    queryFn: () => fetchSuspendedPeers(),
    queryKey: ['peers', 'suspended'],
    staleTime: STALE,
  });
}

/** Global node blacklist. */
export function useBlacklist(): UseQueryResult<IBlackPeer[]> {
  return useQuery({
    queryFn: () => fetchBlacklistedPeers(),
    queryKey: ['peers', 'blacklist'],
    staleTime: STALE,
  });
}
