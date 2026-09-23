/**
 * The pair catalogue, read from the network config.
 *
 * Extracted from `TradingPairSelector` because it is data, not a component.
 * Two things now read it — the selector and the terminal's markets rail — and
 * importing a rendered component to reach a constant meant any test mocking
 * that component lost the catalogue with it.
 */
import { NetworkConfig } from '@/config';
import { type TradingPair } from '@/stores/dexStore';

/** assetId → ticker, for ids the config does not name. */
const assetNameCache = new Map<string, string>();

/**
 * Record a ticker resolved from the network for an id the config does not
 * name. `TradingPairSelector` fetches those and feeds them back here, so a
 * later `getAssetDisplayName` returns the real ticker rather than a truncated
 * id.
 */
export const cacheAssetName = (assetId: string, name: string): void => {
  assetNameCache.set(assetId, name);
};

/**
 * Display name for an asset id: the configured ticker where one exists, the id
 * itself when it is already a ticker, and a shortened id otherwise.
 */
export const getAssetDisplayName = (assetId: string): string => {
  const ticker = NetworkConfig.getAssetTicker(assetId);
  if (ticker) return ticker;

  if (assetId === 'DCC' || assetId.length <= 5) return assetId;

  if (assetNameCache.has(assetId)) {
    return assetNameCache.get(assetId) ?? `${assetId.substring(0, 6)}...`;
  }

  return `${assetId.substring(0, 6)}...`;
};

export const loadTradingPairs = (): TradingPair[] =>
  NetworkConfig.getTradingPairs().map(([amountAsset, priceAsset]) => ({
    amountAsset,
    amountAssetName: getAssetDisplayName(amountAsset),
    priceAsset,
    priceAssetName: getAssetDisplayName(priceAsset),
  }));

export const AVAILABLE_PAIRS: TradingPair[] = loadTradingPairs();

/**
 * Preferred opening pair, falling back to the first configured one.
 *
 * Null when the network configures no pairs at all, so the UI can say so
 * rather than rendering a pair with empty asset ids that makes every
 * downstream request fail.
 */
const getDefaultPair = (): TradingPair | null => {
  const dccCrc = AVAILABLE_PAIRS.find(
    (pair) => pair.amountAssetName === 'DCC' && pair.priceAssetName === 'CRC',
  );

  return dccCrc ?? AVAILABLE_PAIRS[0] ?? null;
};

export const DEFAULT_PAIR = getDefaultPair();
