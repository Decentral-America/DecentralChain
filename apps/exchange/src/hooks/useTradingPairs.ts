/**
 * useTradingPairs Hook
 *
 * Provides access to trading pairs configuration from mainnet.json
 * Matches Angular's DCCApp.tradingPairs usage in DEX components
 */

import { useMemo } from 'react';
import { NetworkConfig } from '@/config/networkConfig';
import { type MatcherPriorityItem, type TradingPair } from '@/config/types';

export interface UseTradingPairsReturn {
  /** All trading pairs from mainnet.json */
  pairs: TradingPair[];

  /** Matcher priority list for asset ordering in UI */
  priorityList: MatcherPriorityItem[];

  /**
   * Find trading pair by asset IDs
   * @param amountAssetId - Amount asset ID (or 'DCC' for native)
   * @param priceAssetId - Price asset ID
   * @returns Trading pair or undefined if not found
   */
  getPairByAssets: (amountAssetId: string, priceAssetId: string) => TradingPair | undefined;

  /**
   * Check if trading pair exists
   * @param amountAssetId - Amount asset ID
   * @param priceAssetId - Price asset ID
   * @returns true if pair exists
   */
  hasPair: (amountAssetId: string, priceAssetId: string) => boolean;

  /**
   * Get all trading pairs for a specific asset
   * @param assetId - Asset ID to find pairs for
   * @returns Array of trading pairs containing this asset
   */
  getPairsForAsset: (assetId: string) => TradingPair[];
}

/**
 * Hook to access trading pairs configuration
 *
 * @example
 * ```tsx
 * const { pairs, getPairByAssets } = useTradingPairs();
 *
 * // Get all pairs
 * pairs.forEach(([amount, price]) => {
 *   logger.debug(`${amount}/${price}`);
 * });
 *
 * // Find specific pair
 * const pair = getPairByAssets('DCC', 'CRC');
 * if (pair) {
 *   logger.debug('DCC/CRC pair exists');
 * }
 * ```
 */
export function useTradingPairs(): UseTradingPairsReturn {
  // Memoize pairs to avoid re-computation on every render
  const pairs = useMemo(() => NetworkConfig.getTradingPairs(), []);

  // Memoize priority list
  const priorityList = useMemo(() => NetworkConfig.getMatcherPriorityList(), []);

  // Find pair by asset IDs
  const getPairByAssets = useMemo(
    () =>
      (amountAssetId: string, priceAssetId: string): TradingPair | undefined => {
        return pairs.find(([amount, price]) => amount === amountAssetId && price === priceAssetId);
      },
    [pairs],
  );

  // Check if pair exists
  const hasPair = useMemo(
    () =>
      (amountAssetId: string, priceAssetId: string): boolean => {
        return getPairByAssets(amountAssetId, priceAssetId) !== undefined;
      },
    [getPairByAssets],
  );

  // Get all pairs for an asset
  const getPairsForAsset = useMemo(
    () =>
      (assetId: string): TradingPair[] => {
        return pairs.filter(([amount, price]) => amount === assetId || price === assetId);
      },
    [pairs],
  );

  return {
    getPairByAssets,
    getPairsForAsset,
    hasPair,
    pairs,
    priorityList,
  };
}
