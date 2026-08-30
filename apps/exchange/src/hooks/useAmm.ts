/**
 * AMM reads.
 *
 * All of this comes from the node and the two contracts directly — the
 * indexer is only needed for volume and history, which nothing here shows.
 */
import { type AmmSdk, toRawAmount } from '@dcc-amm/sdk';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useMultipleAssetDetails } from '@/api/services/assetsService';
import { AMM_DEFAULT_FEE_BPS, DCC_ASSET, DCC_DECIMALS } from '@/config/amm';
import { getAmmSdk } from '@/services/amm/client';

type PoolState = Awaited<ReturnType<AmmSdk['listPools']>>[number];
export type AmmPool = PoolState;

const POLL_MS = 15_000;

/** Every pool the contract knows about. */
export const useAmmPools = (): UseQueryResult<AmmPool[], Error> =>
  useQuery({
    queryFn: () => getAmmSdk().listPools(),
    queryKey: ['amm', 'pools'],
    refetchInterval: POLL_MS,
    staleTime: POLL_MS,
  });

/**
 * Whether the protocol is paused.
 *
 * The one admin read a swap UI should surface: while paused every callable
 * refuses, so the trade controls must say so rather than letting someone sign
 * a transaction that pays a fee and does nothing.
 */
export const useAmmPaused = (): UseQueryResult<boolean, Error> =>
  useQuery({
    queryFn: () => getAmmSdk().isPaused(),
    queryKey: ['amm', 'paused'],
    refetchInterval: 30_000,
    staleTime: 30_000,
  });

/**
 * Asset metadata for every token that appears in a pool.
 *
 * Decimals matter beyond display: `toRawAmount` needs the right scale, and
 * using DCC's 8 for a 6-decimal token misprices the trade by 100×.
 */
export interface AmmAssetMeta {
  decimals: number;
  name: string;
}

export const useAmmAssetMeta = (pools: AmmPool[] | undefined) => {
  const assetIds = useMemo(() => {
    const ids = new Set<string>();
    for (const pool of pools ?? []) {
      for (const token of [pool.token0, pool.token1]) {
        if (token && token !== DCC_ASSET) ids.add(token);
      }
    }
    return [...ids];
  }, [pools]);

  const { data, isLoading } = useMultipleAssetDetails(assetIds, {
    enabled: assetIds.length > 0,
  });

  const metaById = useMemo(() => {
    const map = new Map<string, AmmAssetMeta>();
    // DCC is the chain's native token and has no asset entry to look up.
    map.set(DCC_ASSET, { decimals: DCC_DECIMALS, name: 'DCC' });

    for (const detail of data ?? []) {
      map.set(detail.assetId, { decimals: detail.decimals, name: detail.name });
    }
    return map;
  }, [data]);

  return { isLoading, metaById };
};

export interface SwapQuoteArgs {
  /** Human amount as typed. Parsed with `toRawAmount`, never float maths. */
  amount: string;
  assetIn: string;
  assetOut: string;
  decimalsIn: number;
  feeBps?: number;
  slippageBps?: bigint;
}

/**
 * A quote for one leg.
 *
 * Read-only and wallet-free, so it can run on every keystroke. The amount is
 * parsed with `toRawAmount`: `BigInt(Math.round(x * 10 ** decimals))` is not
 * equivalent — `Math.round(0.1 * 1e8)` does not reliably give `10000000n`, and
 * that difference is a real misquote.
 */
export const useSwapQuote = ({
  amount,
  assetIn,
  assetOut,
  decimalsIn,
  feeBps = AMM_DEFAULT_FEE_BPS,
  slippageBps = 50n,
}: SwapQuoteArgs) => {
  const parsed = useMemo(() => {
    const trimmed = amount.trim();
    if (!trimmed || Number.parseFloat(trimmed) <= 0) return null;

    try {
      return toRawAmount(trimmed, decimalsIn);
    } catch {
      return null;
    }
  }, [amount, decimalsIn]);

  return useQuery({
    enabled: parsed !== null && assetIn !== assetOut,
    queryFn: () => getAmmSdk().quoteSwap(parsed as bigint, assetIn, assetOut, feeBps, slippageBps),
    queryKey: ['amm', 'quote', assetIn, assetOut, parsed?.toString(), feeBps, String(slippageBps)],
    // A quote is a snapshot of reserves that other trades move.
    staleTime: 10_000,
  });
};

/** An address's balance of one asset, in raw units. */
export const useAmmBalance = (
  address: string | undefined,
  assetId: string | null,
): UseQueryResult<bigint, Error> =>
  useQuery({
    enabled: Boolean(address),
    queryFn: () => getAmmSdk().getBalance(address as string, assetId),
    queryKey: ['amm', 'balance', address, assetId],
    refetchInterval: POLL_MS,
  });

/**
 * An address's LP position in a pool.
 *
 * Two storage models exist. Legacy pools track LP share in an internal
 * contract ledger; newer pools issue a real, transferable LP token. Reading
 * the ledger for a pool that issued a token reports zero while the user holds
 * spendable LP tokens — so prefer the token balance whenever `lpAssetId` is
 * set, and fall back to the ledger only for pools without one.
 */
export const useLpPosition = (
  pool: AmmPool | undefined,
  address: string | undefined,
): UseQueryResult<bigint, Error> =>
  useQuery({
    enabled: Boolean(pool && address),
    queryFn: () => {
      const sdk = getAmmSdk();
      const target = pool as AmmPool;

      return target.lpAssetId
        ? sdk.getBalance(address as string, target.lpAssetId)
        : sdk.getLpBalance(target.poolId, address as string);
    },
    queryKey: ['amm', 'lp', pool?.poolId, pool?.lpAssetId, address],
    refetchInterval: POLL_MS,
  });
