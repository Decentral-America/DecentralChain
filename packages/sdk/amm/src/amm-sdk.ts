/**
 * DCC AMM SDK — Main entry point (v2).
 *
 * Combines node client, quote engine, and transaction builder into
 * a unified, ergonomic API for interacting with the AMM v2 protocol.
 */

import { formatAmount, fromRawAmount, toRawAmount } from './amounts';
import { getPoolId, normalizeAssetId } from './core';
import { NodeClient } from './node-client';
import {
  computeSwapQuote,
  estimateAddLiquidity,
  estimateInitialLp,
  estimateRemoveLiquidity,
  getSpotPrice,
} from './quote-engine';
import { TxBuilder } from './tx-builder';
import {
  type AmmSdkConfig,
  type InvokeScriptTx,
  type PoolStateV2,
  type SwapQuoteV2,
} from './types';

export class AmmSdk {
  public readonly node: NodeClient;
  public readonly tx: TxBuilder;
  public readonly config: AmmSdkConfig;

  constructor(config: AmmSdkConfig) {
    this.config = config;
    this.node = new NodeClient(config);
    this.tx = new TxBuilder(config);
  }

  // ─── Pool Discovery ──────────────────────────────────────────────

  /** Get pool state by pool ID (e.g., "p:DCC:3PAbcd:30") */
  async getPool(poolId: string): Promise<PoolStateV2 | null> {
    return this.node.getPoolState(poolId);
  }

  /** Get pool state by token pair + fee tier */
  async getPoolByPair(
    assetA: string | null,
    assetB: string | null,
    feeBps: number = 35,
  ): Promise<PoolStateV2 | null> {
    return this.node.getPoolByPair(assetA, assetB, feeBps);
  }

  /** List all pools */
  async listPools(): Promise<PoolStateV2[]> {
    return this.node.listPools();
  }

  /** Get pool count */
  async getPoolCount(): Promise<number> {
    return this.node.getPoolCount();
  }

  /** Get LP balance for an address in a pool */
  async getLpBalance(poolId: string, address: string): Promise<bigint> {
    return this.node.getLpBalance(poolId, address);
  }

  // ─── Quoting ─────────────────────────────────────────────────────

  /** Compute a swap quote (auto-discovers fee tier if exact match not found) */
  async quoteSwap(
    amountIn: bigint,
    inputAssetId: string | null,
    outputAssetId: string | null,
    feeBps: number = 35,
    slippageBps: bigint = 50n,
  ): Promise<SwapQuoteV2> {
    const poolId = getPoolId(inputAssetId, outputAssetId, feeBps);
    let pool = await this.node.getPoolState(poolId);
    if (!pool) {
      pool = await this.node.findPoolForPair(inputAssetId, outputAssetId);
    }
    if (!pool) throw new Error(`No pool found: ${poolId}`);
    if (pool.reserve0 === 0n) throw new Error('Pool has no liquidity');

    return computeSwapQuote(amountIn, inputAssetId, pool, slippageBps);
  }

  /** Get spot price for a pool */
  async getSpotPrice(poolId: string) {
    const pool = await this.node.getPoolState(poolId);
    if (!pool) throw new Error(`Pool not found: ${poolId}`);
    return getSpotPrice(pool);
  }

  // ─── Transaction Building ────────────────────────────────────────

  /** Build a swap transaction */
  async buildSwap(
    amountIn: bigint,
    inputAssetId: string | null,
    outputAssetId: string | null,
    feeBps: number = 35,
    slippageBps: bigint = 50n,
    deadlineMs: number = 0,
  ): Promise<{ tx: InvokeScriptTx; quote: SwapQuoteV2 }> {
    const quote = await this.quoteSwap(amountIn, inputAssetId, outputAssetId, feeBps, slippageBps);

    const deadline = deadlineMs || Date.now() + 120_000; // 2 min default

    const tx = this.tx.buildSwapExactIn({
      amountIn,
      assetIn: normalizeAssetId(inputAssetId),
      assetOut: normalizeAssetId(outputAssetId),
      deadline,
      feeBps: quote.feeBps,
      minAmountOut: quote.minAmountOut,
    });

    return { quote, tx };
  }

  /** Build an add-liquidity transaction */
  async buildAddLiquidity(
    assetA: string | null,
    assetB: string | null,
    amountA: bigint,
    amountB: bigint,
    feeBps: number = 35,
    slippageBps: bigint = 50n,
    deadlineMs: number = 0,
  ) {
    const poolId = getPoolId(assetA, assetB, feeBps);
    const pool = await this.node.getPoolState(poolId);
    if (!pool) throw new Error(`Pool not found: ${poolId}`);

    // Use initialLiquidity estimate when pool is empty, addLiquidity otherwise
    const estimate =
      pool.reserve0 === 0n && pool.reserve1 === 0n && pool.lpSupply === 0n
        ? {
            actualAmountA: amountA,
            actualAmountB: amountB,
            lpMinted: estimateInitialLp(amountA, amountB).lpMinted,
            refundA: 0n,
            refundB: 0n,
          }
        : estimateAddLiquidity(amountA, amountB, pool);
    const slippageFactor = 10000n - slippageBps;
    // Min amounts based on estimated actuals (not desired), since the contract
    // adjusts one side down to match the pool ratio.
    const amountAMin = (estimate.actualAmountA * slippageFactor) / 10000n;
    const amountBMin = (estimate.actualAmountB * slippageFactor) / 10000n;

    const deadline = deadlineMs || Date.now() + 120_000;

    const tx = this.tx.buildAddLiquidity({
      amountADesired: amountA,
      amountAMin,
      amountBDesired: amountB,
      amountBMin,
      assetA: normalizeAssetId(assetA),
      assetB: normalizeAssetId(assetB),
      deadline,
      feeBps,
    });

    return { estimate, tx };
  }

  /** Build a remove-liquidity transaction */
  async buildRemoveLiquidity(
    assetA: string | null,
    assetB: string | null,
    feeBps: number = 35,
    lpAmount: bigint,
    slippageBps: bigint = 50n,
    deadlineMs: number = 0,
  ) {
    const poolId = getPoolId(assetA, assetB, feeBps);
    const pool = await this.node.getPoolState(poolId);
    if (!pool) throw new Error(`Pool not found: ${poolId}`);

    const estimate = estimateRemoveLiquidity(lpAmount, pool);
    const slippageFactor = 10000n - slippageBps;
    const amountAMin = (estimate.amountA * slippageFactor) / 10000n;
    const amountBMin = (estimate.amountB * slippageFactor) / 10000n;

    const deadline = deadlineMs || Date.now() + 120_000;

    const tx = this.tx.buildRemoveLiquidity({
      amountAMin,
      amountBMin,
      assetA: normalizeAssetId(assetA),
      assetB: normalizeAssetId(assetB),
      deadline,
      feeBps,
      lpAmount,
    });

    return { estimate, tx };
  }

  /** Build a create-pool transaction */
  buildCreatePool(assetA: string | null, assetB: string | null, feeBps: number = 35) {
    const tx = this.tx.buildCreatePool({
      assetA: normalizeAssetId(assetA),
      assetB: normalizeAssetId(assetB),
      feeBps,
    });

    return { tx };
  }

  // ─── Utilities ───────────────────────────────────────────────────

  async getBalance(address: string, assetId: string | null): Promise<bigint> {
    return this.node.getBalance(address, assetId);
  }

  async isPaused(): Promise<boolean> {
    return this.node.isPaused();
  }

  async getHeight(): Promise<number> {
    return this.node.getHeight();
  }

  // ─── Amount Helpers ──────────────────────────────────────────────

  toRawAmount = toRawAmount;
  fromRawAmount = fromRawAmount;
  formatAmount = formatAmount;
}
