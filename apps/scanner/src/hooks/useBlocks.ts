import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import {
  fetchBlockAt,
  fetchBlockById,
  fetchBlockHeadersSeq,
  type IBlock,
  type IBlockHeader,
} from '@/lib/api';

const STALE = 10_000;

/** Fetch a single block by chain height. */
export function useBlockAt(height: number | null): UseQueryResult<IBlock> {
  return useQuery({
    enabled: height !== null && height > 0,
    queryFn: () => fetchBlockAt(height!),
    queryKey: ['block', 'height', height],
    staleTime: STALE,
  });
}

/** Fetch a single block by block ID / signature hash. */
export function useBlockById(id: string | null): UseQueryResult<IBlock> {
  return useQuery({
    enabled: !!id,
    queryFn: () => fetchBlockById(id!),
    queryKey: ['block', 'id', id],
    staleTime: STALE,
  });
}

/**
 * Fetch a sequence of block headers for the given height range.
 * Typically used by page-level block lists (Dashboard, Blocks).
 */
export function useBlockHeaders(
  from: number,
  to: number,
  options: { enabled?: boolean; refetchInterval?: number | false } = {},
): UseQueryResult<IBlockHeader[]> {
  const { enabled = true, refetchInterval = false } = options;
  return useQuery({
    enabled: enabled && from > 0 && to >= from,
    queryFn: () => fetchBlockHeadersSeq(from, to),
    queryKey: ['blockHeaders', from, to],
    refetchInterval,
    staleTime: STALE,
  });
}
