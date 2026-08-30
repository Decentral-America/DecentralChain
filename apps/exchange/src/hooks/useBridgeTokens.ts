/**
 * useBridgeTokens Hook
 * The assets the bridge will accept, already filtered of the ones it would strand.
 */
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { getTokens } from '@/services/bridge/api';
import { type BridgeToken } from '@/services/bridge/types';

/**
 * The API caches the token list for 30 seconds, which is also how long a
 * disable takes to propagate. Matching that here means the UI stops offering a
 * newly-disabled asset within the same window, and no sooner than the data can
 * actually change.
 */
const CACHE_TTL_MS = 30_000;

export const bridgeTokensQueryKey = ['bridge', 'tokens'] as const;

export const useBridgeTokens = (): UseQueryResult<BridgeToken[], Error> =>
  useQuery({
    queryFn: getTokens,
    queryKey: bridgeTokensQueryKey,
    refetchInterval: CACHE_TTL_MS,
    staleTime: CACHE_TTL_MS,
  });

/** Look one up by mint — the identity an asset carries across both endpoints. */
export const findTokenByMint = (
  tokens: BridgeToken[] | undefined,
  splMint: string | null,
): BridgeToken | undefined =>
  splMint ? tokens?.find((token) => token.splMint === splMint) : undefined;
