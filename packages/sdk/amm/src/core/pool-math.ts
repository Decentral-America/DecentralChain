/**
 * AMM pool math — constant-product formulas.
 *
 * All functions use BigInt. All division is floor.
 * All outputs round in favor of the pool (against the caller).
 *
 * These functions are the SINGLE source of truth for the AMM math.
 * The RIDE contract implements the same formulas.
 * The SDK uses these functions for off-chain quoting.
 */

import { BPS_DENOMINATOR, MAX_FEE_BPS, MIN_FEE_BPS, MINIMUM_LIQUIDITY } from './constants';
import { bigMin, fraction, isqrt } from './math';

// ─── Validation helpers ───────────────────────────────────────────────

function requirePositive(value: bigint, name: string): void {
  if (value <= 0n) {
    throw new Error(`${name} must be positive, got ${value}`);
  }
}

function requireNonNegative(value: bigint, name: string): void {
  if (value < 0n) {
    throw new Error(`${name} must be non-negative, got ${value}`);
  }
}

function requireValidFee(feeBps: bigint): void {
  if (feeBps < MIN_FEE_BPS || feeBps > MAX_FEE_BPS) {
    throw new Error(`feeBps must be between ${MIN_FEE_BPS} and ${MAX_FEE_BPS}, got ${feeBps}`);
  }
}

// ─── Initial liquidity (pool creation) ────────────────────────────────

export interface InitialLiquidityResult {
  /** LP tokens minted to the creator */
  lpMinted: bigint;
  /** LP tokens permanently locked */
  lpLocked: bigint;
  /** Total LP supply (minted + locked) */
  totalLpSupply: bigint;
}

/**
 * Calculate LP tokens for initial pool creation.
 *
 * lpTotal = floor(sqrt(amountA * amountB))
 * lpMinted = lpTotal - MINIMUM_LIQUIDITY
 *
 * @param amountA - Amount of token A deposited
 * @param amountB - Amount of token B deposited
 * @returns LP amounts
 * @throws if amounts are non-positive or if liquidity would be insufficient
 */
export function getInitialLiquidity(amountA: bigint, amountB: bigint): InitialLiquidityResult {
  requirePositive(amountA, 'amountA');
  requirePositive(amountB, 'amountB');

  const totalLpSupply = isqrt(amountA * amountB);

  if (totalLpSupply <= MINIMUM_LIQUIDITY) {
    throw new Error(
      `Insufficient initial liquidity: sqrt(${amountA} * ${amountB}) = ${totalLpSupply} <= ${MINIMUM_LIQUIDITY}`,
    );
  }

  const lpMinted = totalLpSupply - MINIMUM_LIQUIDITY;

  return {
    lpLocked: MINIMUM_LIQUIDITY,
    lpMinted,
    totalLpSupply,
  };
}

// ─── Subsequent liquidity addition ────────────────────────────────────

export interface AddLiquidityResult {
  /** LP tokens minted to the provider */
  lpMinted: bigint;
  /** Actual amount of token A accepted */
  actualAmountA: bigint;
  /** Actual amount of token B accepted */
  actualAmountB: bigint;
  /** Refund of token A (if any) */
  refundA: bigint;
  /** Refund of token B (if any) */
  refundB: bigint;
}

/**
 * Calculate LP tokens for adding liquidity to an existing pool.
 *
 * The user deposits tokens proportional to current reserves.
 * LP minted = min(amountA * totalSupply / reserveA, amountB * totalSupply / reserveB)
 * Excess of one token is refunded.
 *
 * @param amountA - Desired amount of token A to deposit
 * @param amountB - Desired amount of token B to deposit
 * @param reserveA - Current reserve of token A
 * @param reserveB - Current reserve of token B
 * @param totalLpSupply - Current total LP token supply
 * @returns LP minted and actual amounts
 */
export function getAddLiquidity(
  amountA: bigint,
  amountB: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalLpSupply: bigint,
): AddLiquidityResult {
  requirePositive(amountA, 'amountA');
  requirePositive(amountB, 'amountB');
  requirePositive(reserveA, 'reserveA');
  requirePositive(reserveB, 'reserveB');
  requirePositive(totalLpSupply, 'totalLpSupply');

  // LP tokens from each side
  const lpFromA = fraction(amountA, totalLpSupply, reserveA);
  const lpFromB = fraction(amountB, totalLpSupply, reserveB);

  // Use the minimum to ensure proportional deposit
  const lpMinted = bigMin(lpFromA, lpFromB);

  if (lpMinted <= 0n) {
    throw new Error('Deposit amounts too small to mint any LP tokens');
  }

  // Calculate actual amounts used (reverse from LP minted)
  let actualAmountA: bigint;
  let actualAmountB: bigint;

  if (lpFromA <= lpFromB) {
    // A is the constraining side
    actualAmountA = amountA;
    // Calculate B needed for this many LP: ceil(lpMinted * reserveB / totalLpSupply)
    // But we use floor to be safe (take less of B)
    actualAmountB = fraction(lpMinted, reserveB, totalLpSupply);
    // Ensure we don't exceed the provided amount
    if (actualAmountB > amountB) {
      actualAmountB = amountB;
    }
  } else {
    // B is the constraining side
    actualAmountB = amountB;
    actualAmountA = fraction(lpMinted, reserveA, totalLpSupply);
    if (actualAmountA > amountA) {
      actualAmountA = amountA;
    }
  }

  return {
    actualAmountA,
    actualAmountB,
    lpMinted,
    refundA: amountA - actualAmountA,
    refundB: amountB - actualAmountB,
  };
}

// ─── Liquidity removal ────────────────────────────────────────────────

export interface RemoveLiquidityResult {
  /** Amount of token A returned */
  amountA: bigint;
  /** Amount of token B returned */
  amountB: bigint;
}

/**
 * Calculate token amounts returned when burning LP tokens.
 *
 * amountA = floor(lpBurn * reserveA / totalSupply)
 * amountB = floor(lpBurn * reserveB / totalSupply)
 *
 * Rounding is DOWN, favoring the pool.
 *
 * @param lpBurn - Amount of LP tokens to burn
 * @param reserveA - Current reserve of token A
 * @param reserveB - Current reserve of token B
 * @param totalLpSupply - Current total LP supply
 * @returns Token amounts to return
 */
export function getRemoveLiquidity(
  lpBurn: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalLpSupply: bigint,
): RemoveLiquidityResult {
  requirePositive(lpBurn, 'lpBurn');
  requirePositive(reserveA, 'reserveA');
  requirePositive(reserveB, 'reserveB');
  requirePositive(totalLpSupply, 'totalLpSupply');

  if (lpBurn > totalLpSupply) {
    throw new Error('Cannot burn more LP tokens than total supply');
  }

  const amountA = fraction(lpBurn, reserveA, totalLpSupply);
  const amountB = fraction(lpBurn, reserveB, totalLpSupply);

  if (amountA === 0n && amountB === 0n) {
    throw new Error('Withdrawal amounts are zero — LP amount too small');
  }

  return { amountA, amountB };
}

// ─── Exact-input swap ─────────────────────────────────────────────────

export interface SwapResult {
  /** Output amount (after fee) */
  amountOut: bigint;
  /** New reserve of input token */
  newReserveIn: bigint;
  /** New reserve of output token */
  newReserveOut: bigint;
  /** Fee amount in input token units */
  feeAmount: bigint;
  /** Price impact in basis points (approximate) */
  priceImpactBps: bigint;
}

/**
 * Compute the output of an exact-input swap.
 *
 * Formula:
 *   amountInWithFee = amountIn * (10000 - feeBps)
 *   amountOut = floor(amountInWithFee * reserveOut / (reserveIn * 10000 + amountInWithFee))
 *
 * Fee is deducted from the input. The full amountIn (including fee portion)
 * is added to reserves, so fees accrue to LPs via reserve growth.
 *
 * @param amountIn - Input amount (raw integer units)
 * @param reserveIn - Reserve of the input token
 * @param reserveOut - Reserve of the output token
 * @param feeBps - Fee in basis points
 * @returns Swap result
 */
export function getAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: bigint,
): SwapResult {
  requirePositive(amountIn, 'amountIn');
  requirePositive(reserveIn, 'reserveIn');
  requirePositive(reserveOut, 'reserveOut');
  requireValidFee(feeBps);

  const amountInWithFee = amountIn * (BPS_DENOMINATOR - feeBps);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * BPS_DENOMINATOR + amountInWithFee;

  const amountOut = numerator / denominator;

  if (amountOut === 0n) {
    throw new Error('Swap output is zero — input amount too small');
  }

  if (amountOut >= reserveOut) {
    throw new Error('Swap output exceeds reserve — insufficient liquidity');
  }

  const newReserveIn = reserveIn + amountIn;
  const newReserveOut = reserveOut - amountOut;

  // Fee in input token terms
  const feeAmount = fraction(amountIn, feeBps, BPS_DENOMINATOR);

  // Price impact in basis points (approximate, for display)
  // spotPrice = reserveOut / reserveIn
  // execPrice = amountOut / amountIn
  // impact = 1 - execPrice / spotPrice = 1 - (amountOut * reserveIn) / (amountIn * reserveOut)
  const idealOut = fraction(amountIn, reserveOut, reserveIn);
  const priceImpactBps = idealOut > 0n ? ((idealOut - amountOut) * BPS_DENOMINATOR) / idealOut : 0n;

  // Verify invariant: new_k >= old_k
  const oldK = reserveIn * reserveOut;
  const newK = newReserveIn * newReserveOut;
  if (newK < oldK) {
    throw new Error(`INVARIANT VIOLATION: k decreased from ${oldK} to ${newK}`);
  }

  return {
    amountOut,
    feeAmount,
    newReserveIn,
    newReserveOut,
    priceImpactBps,
  };
}

// ─── Quote (no-fee, for price display) ────────────────────────────────

/**
 * Simple quote: how much of tokenB is equivalent to amountA of tokenA
 * at current reserves, WITHOUT fee. Used for display purposes.
 *
 * quote = floor(amountA * reserveB / reserveA)
 */
export function quote(amountA: bigint, reserveA: bigint, reserveB: bigint): bigint {
  requirePositive(amountA, 'amountA');
  requirePositive(reserveA, 'reserveA');
  requirePositive(reserveB, 'reserveB');
  return fraction(amountA, reserveB, reserveA);
}

// ─── Slippage helpers ─────────────────────────────────────────────────

/**
 * Calculate minimum acceptable output given slippage tolerance.
 *
 * minAmountOut = floor(amountOut * (10000 - slippageBps) / 10000)
 *
 * @param amountOut - Expected output amount
 * @param slippageBps - Slippage tolerance in basis points (e.g., 50 = 0.5%)
 */
export function getMinAmountOut(amountOut: bigint, slippageBps: bigint): bigint {
  requireNonNegative(amountOut, 'amountOut');
  requireNonNegative(slippageBps, 'slippageBps');

  if (slippageBps >= BPS_DENOMINATOR) {
    throw new Error('Slippage must be less than 100%');
  }

  return fraction(amountOut, BPS_DENOMINATOR - slippageBps, BPS_DENOMINATOR);
}
