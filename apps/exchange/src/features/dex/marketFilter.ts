/**
 * Pure filtering of the matcher's market list (`GET /matcher/orderbook`).
 *
 * Kept free of imports so it can be unit-tested without the app's config or
 * HTTP client. Structurally compatible with `TradingPair` from the dex store.
 */

/** One entry of `markets` in the matcher's `/matcher/orderbook` response. */
export interface MatcherMarket {
  amountAsset: string;
  amountAssetName: string;
  priceAsset: string;
  priceAssetName: string;
  /** Epoch milliseconds the order book was created. */
  created: number;
}

export interface VisiblePair {
  amountAsset: string;
  amountAssetName: string;
  priceAsset: string;
  priceAssetName: string;
}

/**
 * Markets the exchange should list: hidden test leftovers removed (by asset
 * name, from the network config), newest first, one entry per pair.
 */
export function marketsToPairs(
  markets: readonly MatcherMarket[],
  hiddenNames: readonly string[],
): VisiblePair[] {
  const hidden = new Set(hiddenNames);
  const seen = new Set<string>();
  return [...markets]
    .filter((m) => !hidden.has(m.amountAssetName) && !hidden.has(m.priceAssetName))
    .sort((a, b) => b.created - a.created)
    .filter((m) => {
      const key = `${m.amountAsset}/${m.priceAsset}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((m) => ({
      amountAsset: m.amountAsset,
      amountAssetName: m.amountAssetName,
      priceAsset: m.priceAsset,
      priceAssetName: m.priceAssetName,
    }));
}
