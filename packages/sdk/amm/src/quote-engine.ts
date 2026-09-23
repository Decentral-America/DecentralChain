/**
 * Quote engine — computes swap quotes, price impact, and slippage.
 *
 * v2: Uses PoolStateV2 and pool IDs instead of legacy pool keys.
 * Uses amm-core pure math functions to guarantee parity with on-chain logic.
 */

import {
  getAddLiquidity,
  getAmountOut,
  getInitialLiquidity,
  getMinAmountOut,
  getRemoveLiquidity,
  normalizeAssetId,
  quote as rawQuote,
} from './core';

import { type PoolStateV2, type SwapQuoteV2 } from './types';

/**
 * Compute a swap quote for an exact-input swap against a v2 pool.
 */
export function computeSwapQuote(
  amountIn: bigint,
  inputAssetId: string | null,
  pool: PoolStateV2,
  slippageBps: bigint = 50n,
): SwapQuoteV2 {
  const normalizedInput = normalizeAssetId(inputAssetId);

  let reserveIn: bigint;
  let reserveOut: bigint;

  if (normalizedInput === pool.token0) {
    reserveIn = pool.reserve0;
    reserveOut = pool.reserve1;
  } else if (normalizedInput === pool.token1) {
    reserveIn = pool.reserve1;
    reserveOut = pool.reserve0;
  } else {
    throw new Error(`Asset ${normalizedInput} not in pool ${pool.poolId}`);
  }

  const result = getAmountOut(amountIn, reserveIn, reserveOut, pool.feeBps);
  const minOut = getMinAmountOut(result.amountOut, slippageBps);

  const outputAsset = normalizedInput === pool.token0 ? pool.token1 : pool.token0;

  return {
    amountIn,
    amountOut: result.amountOut,
    assetIn: normalizedInput,
    assetOut: outputAsset,
    feeAmount: result.feeAmount,
    feeBps: Number(pool.feeBps),
    minAmountOut: minOut,
    poolId: pool.poolId,
    priceImpactBps: result.priceImpactBps,
    route: `${normalizedInput} -> ${outputAsset}`,
  };
}

/**
 * Compute a proportional quote for display.
 */
export function computeProportionalQuote(amount0: bigint, pool: PoolStateV2): bigint {
  return rawQuote(amount0, pool.reserve0, pool.reserve1);
}

/**
 * Compute spot price (token0 in terms of token1).
 */
export function getSpotPrice(pool: PoolStateV2): {
  price0to1: number;
  price1to0: number;
} {
  if (pool.reserve0 === 0n || pool.reserve1 === 0n) {
    return { price0to1: 0, price1to0: 0 };
  }
  const price0to1 = Number(pool.reserve1) / Number(pool.reserve0);
  const price1to0 = Number(pool.reserve0) / Number(pool.reserve1);
  return { price0to1, price1to0 };
}

/**
 * Estimate LP tokens for initial pool creation.
 */
export function estimateInitialLp(amountA: bigint, amountB: bigint) {
  return getInitialLiquidity(amountA, amountB);
}

/**
 * Estimate LP tokens for adding liquidity.
 */
export function estimateAddLiquidity(amount0: bigint, amount1: bigint, pool: PoolStateV2) {
  return getAddLiquidity(amount0, amount1, pool.reserve0, pool.reserve1, pool.lpSupply);
}

/**
 * Estimate token amounts returned for removing liquidity.
 */
export function estimateRemoveLiquidity(lpBurn: bigint, pool: PoolStateV2) {
  return getRemoveLiquidity(lpBurn, pool.reserve0, pool.reserve1, pool.lpSupply);
}

export { getPoolId } from './core';
