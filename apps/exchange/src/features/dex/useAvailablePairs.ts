/**
 * The DEX market list for this build's network, from wherever the network
 * config says it lives: the curated `tradingPairs` list, or the matcher.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { NetworkConfig } from '@/config/networkConfig';
import { type MarketSource } from '@/config/types';
import { type TradingPair } from '@/stores/dexStore';
import { fetchMatcherPairs } from './matcherMarkets';
import { AVAILABLE_PAIRS, pickDefaultPair } from './tradingPairs';

const NO_PAIRS: TradingPair[] = [];

export interface AvailablePairs {
  pairs: TradingPair[];
  defaultPair: TradingPair | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAvailablePairs(
  source: MarketSource = NetworkConfig.marketSource,
): AvailablePairs {
  const fromMatcher = source === 'matcher';
  const query = useQuery({
    enabled: fromMatcher,
    queryFn: fetchMatcherPairs,
    queryKey: ['matcher', 'markets', 'visible'],
    staleTime: 60_000,
  });

  const pairs = useMemo(
    () => (fromMatcher ? (query.data ?? NO_PAIRS) : AVAILABLE_PAIRS),
    [fromMatcher, query.data],
  );
  const defaultPair = useMemo(() => pickDefaultPair(pairs), [pairs]);

  return {
    defaultPair,
    error: fromMatcher ? (query.error ?? null) : null,
    isLoading: fromMatcher && query.isLoading,
    pairs,
  };
}
