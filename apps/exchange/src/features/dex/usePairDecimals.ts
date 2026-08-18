/**
 * Resolve the decimals of both assets in a trading pair.
 *
 * The order forms need these to scale amount and price correctly (see
 * `orderScaling`). `TradingPair` in the store carries only ids and display
 * names, so they are fetched per asset.
 *
 * `isReady` is deliberately false until both are known. Defaulting to 8 while
 * loading would reintroduce exactly the bug this exists to prevent — a signed
 * order is not something to guess at, so callers should block submission until
 * this resolves.
 */
import { useAssetDetails } from '@/api/services/assetsService';
import { type TradingPair } from '@/stores/dexStore';
import { DCC_DECIMALS } from './orderScaling';

export interface PairDecimals {
  amountDecimals: number;
  priceDecimals: number;
  /** True once both assets' decimals are known. */
  isReady: boolean;
}

/** The native token is not an issued asset, so it has no /assets/details entry. */
function isNativeDcc(assetId: string | undefined): boolean {
  return !assetId || assetId === 'DCC';
}

/**
 * @param pair - The selected trading pair, or null when none is chosen.
 */
export function usePairDecimals(pair: TradingPair | null): PairDecimals {
  const amountIsDcc = isNativeDcc(pair?.amountAsset);
  const priceIsDcc = isNativeDcc(pair?.priceAsset);

  const { data: amountAsset } = useAssetDetails(pair?.amountAsset ?? '', {
    enabled: !!pair && !amountIsDcc,
  });
  const { data: priceAsset } = useAssetDetails(pair?.priceAsset ?? '', {
    enabled: !!pair && !priceIsDcc,
  });

  const amountDecimals = amountIsDcc ? DCC_DECIMALS : amountAsset?.decimals;
  const priceDecimals = priceIsDcc ? DCC_DECIMALS : priceAsset?.decimals;

  return {
    amountDecimals: amountDecimals ?? DCC_DECIMALS,
    isReady: !!pair && amountDecimals !== undefined && priceDecimals !== undefined,
    priceDecimals: priceDecimals ?? DCC_DECIMALS,
  };
}
