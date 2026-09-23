/**
 * The tradeable set, derived from the pools that actually exist.
 *
 * Every pair here is one the contract can fill. Offering an asset the AMM has
 * no pool for produces a quote failure at best and a mined, reverted
 * transaction at worst.
 */
import { useMemo } from 'react';
import { DCC_ASSET } from '@/config/amm';
import { type AmmAssetMeta, type AmmPool } from '@/hooks/useAmm';

export interface SwapAsset {
  assetId: string;
  decimals: number;
  name: string;
}

export const useSwapAssets = (
  pools: AmmPool[] | undefined,
  metaById: Map<string, AmmAssetMeta>,
): SwapAsset[] =>
  useMemo(() => {
    const seen = new Map<string, SwapAsset>();

    for (const pool of pools ?? []) {
      for (const assetId of [pool.token0, pool.token1]) {
        if (!assetId || seen.has(assetId)) continue;
        const meta = metaById.get(assetId);
        seen.set(assetId, {
          assetId,
          decimals: meta?.decimals ?? 8,
          name: meta?.name ?? (assetId === DCC_ASSET ? 'DCC' : `${assetId.slice(0, 6)}…`),
        });
      }
    }

    return [...seen.values()];
  }, [pools, metaById]);

/** The pool for a pair at a fee tier, if one exists. */
export const findPool = (
  pools: AmmPool[] | undefined,
  a: string,
  b: string,
  feeBps: number,
): AmmPool | undefined =>
  pools?.find(
    (pool) =>
      Number(pool.feeBps) === feeBps &&
      ((pool.token0 === a && pool.token1 === b) || (pool.token0 === b && pool.token1 === a)),
  );
