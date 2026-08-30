/**
 * useDepositLimits Hook
 * Per-asset deposit bounds, plus which of them will actually bind.
 */
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { getDepositLimits } from '@/services/bridge/api';
import { type DepositLimits } from '@/services/bridge/types';

/**
 * Shorter than the token list's TTL because one field here moves on its own:
 * the daily volume counter is shared across every token, so it advances
 * whenever anyone deposits anything.
 */
const STALE_MS = 15_000;

export const depositLimitsQueryKey = (splMint: string) =>
  ['bridge', 'deposit-limits', splMint] as const;

export const useDepositLimits = (splMint: string | null): UseQueryResult<DepositLimits, Error> =>
  useQuery({
    enabled: Boolean(splMint),
    queryFn: () => getDepositLimits(splMint as string),
    queryKey: depositLimitsQueryKey(splMint ?? ''),
    refetchInterval: STALE_MS,
    staleTime: STALE_MS,
  });
