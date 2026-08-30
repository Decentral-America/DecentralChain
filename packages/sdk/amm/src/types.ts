/**
 * SDK type definitions for pool state, swap params, and transaction building.
 *
 * v3: Pool ID format is "p:<token0>:<token1>:<feeBps>".
 *     LP tokens are real on-chain assets issued by the dApp.
 *     Lock liquidity by burning LP tokens.
 */

// ── v2 Pool State ───────────────────────────────────────────────────

/** v3 pool state — matches Pool.ride v3 state schema */
export interface PoolStateV2 {
  /** Pool ID: "p:<token0>:<token1>:<feeBps>" */
  poolId: string;
  /** Canonical first token */
  token0: string;
  /** Canonical second token */
  token1: string;
  /** Reserve of token0 */
  reserve0: bigint;
  /** Reserve of token1 */
  reserve1: bigint;
  /** Total LP supply (includes permanently locked minLiquidity) */
  lpSupply: bigint;
  /** LP token assetId (Base58). Empty string if legacy pool without LP token. */
  lpAssetId: string;
  /** Fee in basis points (1-1000) */
  feeBps: bigint;
  /** Last k = reserve0 x reserve1 */
  lastK: bigint;
  /** Pool creation timestamp */
  createdAt: number;
  /** Whether pool exists */
  exists: boolean;
  /** Analytics */
  swapCount: number;
  volume0: bigint;
  volume1: bigint;
  fees0: bigint;
  fees1: bigint;
}

// ── v2 Quote Result ─────────────────────────────────────────────────

/** Quote result for a v2 swap */
export interface SwapQuoteV2 {
  poolId: string;
  assetIn: string;
  assetOut: string;
  feeBps: number;
  amountIn: bigint;
  amountOut: bigint;
  minAmountOut: bigint;
  priceImpactBps: bigint;
  feeAmount: bigint;
  route: string;
}

// ── v2 Parameter Types ──────────────────────────────────────────────

/** v2 createPool: no payments, just metadata */
export interface CreatePoolParamsV2 {
  assetA: string;
  assetB: string;
  feeBps: number;
}

/** v2 addLiquidity: both tokens + slippage */
export interface AddLiquidityParamsV2 {
  assetA: string;
  assetB: string;
  feeBps: number;
  amountADesired: bigint;
  amountBDesired: bigint;
  amountAMin: bigint;
  amountBMin: bigint;
  deadline: number;
}

/** v3 removeLiquidity: send LP tokens as payment */
export interface RemoveLiquidityParamsV2 {
  assetA: string;
  assetB: string;
  feeBps: number;
  lpAmount: bigint;
  amountAMin: bigint;
  amountBMin: bigint;
  deadline: number;
  /** LP token assetId (required for pools with LP tokens) */
  lpAssetId?: string;
}

/** v3 lockLiquidity: burn LP tokens to permanently lock liquidity */
export interface LockLiquidityParams {
  assetA: string;
  assetB: string;
  feeBps: number;
  /** LP token assetId */
  lpAssetId: string;
  /** Amount of LP tokens to burn/lock */
  lpAmount: bigint;
}

/** v3 claimLpTokens: claim real LP tokens for legacy pool positions */
export interface ClaimLpTokensParams {
  assetA: string;
  assetB: string;
  feeBps: number;
}

/** v2 swapExactIn */
export interface SwapExactInParamsV2 {
  assetIn: string;
  assetOut: string;
  feeBps: number;
  amountIn: bigint;
  minAmountOut: bigint;
  deadline: number;
}

// ── SDK Configuration ───────────────────────────────────────────────

/** SDK configuration */
export interface AmmSdkConfig {
  nodeUrl: string;
  dAppAddress: string;
  /** Router contract address (for swaps). Falls back to dAppAddress if not set. */
  routerAddress?: string;
  chainId: string;
}

// ── Node API Types ──────────────────────────────────────────────────

/** DecentralChain data entry (from node API) */
export interface DataEntry {
  key: string;
  type: 'integer' | 'string' | 'boolean' | 'binary';
  value: number | string | boolean;
}

/** InvokeScript transaction structure */
export interface InvokeScriptTx {
  type: 16;
  dApp: string;
  call: {
    function: string;
    args: Array<{ type: string; value: string | number | boolean }>;
  };
  payment: Array<{
    assetId: string | null;
    amount: number;
  }>;
  fee: number;
  chainId: string;
}
