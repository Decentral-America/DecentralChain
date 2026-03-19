import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { fetchNodeStatus, fetchNodeVersion } from '@/lib/api';

/** Fetch the node software version string. Very stable — cached for 5 minutes. */
export function useNodeVersion(): UseQueryResult<{ version: string }> {
  return useQuery({
    queryFn: () => fetchNodeVersion(),
    queryKey: ['nodeVersion'],
    staleTime: 5 * 60_000,
  });
}

/** Fetch current node status (block height, state hash, etc.). */
export function useNodeStatus(): UseQueryResult<unknown> {
  return useQuery({
    queryFn: () => fetchNodeStatus(),
    queryKey: ['nodeStatus'],
    staleTime: 30_000,
  });
}
