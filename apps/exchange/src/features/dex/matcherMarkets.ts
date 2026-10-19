/**
 * The matcher's live market list, filtered for display.
 *
 * Networks whose config sets `marketSource: "matcher"` (testnet) list what the
 * matcher actually trades instead of a hardcoded asset id that a chain
 * re-genesis can silently invalidate.
 */
import { matcherClient } from '@/api/client';
import { NetworkConfig } from '@/config/networkConfig';
import { type TradingPair } from '@/stores/dexStore';
import { type MatcherMarket, marketsToPairs } from './marketFilter';

interface MatcherMarketsResponse {
  markets?: MatcherMarket[];
}

export async function fetchMatcherPairs(): Promise<TradingPair[]> {
  // matcherClient's base URL already ends in /matcher.
  const { data } = await matcherClient.get<MatcherMarketsResponse>('/orderbook');
  return marketsToPairs(data.markets ?? [], NetworkConfig.getHiddenMarketAssetNames());
}
