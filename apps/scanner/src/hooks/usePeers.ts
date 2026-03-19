import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import {
  fetchAllPeers,
  fetchBlacklistedPeers,
  fetchConnectedPeers,
  fetchSuspendedPeers,
} from '@/lib/api';
import { type Peer } from '@/types';

const STALE = 30_000;
const INTERVAL = 30_000;

/** Stream of currently connected peers, re-fetched every 30 s. */
export function useConnectedPeers(): UseQueryResult<Peer[]> {
  return useQuery({
    queryFn: () => fetchConnectedPeers() as Promise<Peer[]>,
    queryKey: ['peers', 'connected'],
    refetchInterval: INTERVAL,
    staleTime: STALE,
  });
}

/** Full peer list (known peers, not necessarily connected). */
export function useAllPeers(): UseQueryResult<Peer[]> {
  return useQuery({
    queryFn: () => fetchAllPeers() as Promise<Peer[]>,
    queryKey: ['peers', 'all'],
    staleTime: STALE,
  });
}

/** List of currently suspended peers. */
export function useSuspendedPeers(): UseQueryResult<Peer[]> {
  return useQuery({
    queryFn: () => fetchSuspendedPeers() as Promise<Peer[]>,
    queryKey: ['peers', 'suspended'],
    staleTime: STALE,
  });
}

/** Global node blacklist. */
export function useBlacklist(): UseQueryResult<Peer[]> {
  return useQuery({
    queryFn: () => fetchBlacklistedPeers() as Promise<Peer[]>,
    queryKey: ['peers', 'blacklist'],
    staleTime: STALE,
  });
}
