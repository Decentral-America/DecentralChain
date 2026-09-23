/**
 * A faithful TypeScript port of the arithmetic actually deployed in
 * PoolCore.ride and SwapRouter.ride — NOT the older Pool.ride design the
 * rest of this package's tests cover. RIDE has no local simulator or
 * testnet available for this project, so this is the only regression net
 * for the formulas that matter most.
 *
 * MAINTENANCE: this must be updated by hand whenever the corresponding
 * RIDE logic changes — nothing enforces the two staying in sync. Treat a
 * change to PoolCore.ride/SwapRouter.ride's math as incomplete until the
 * matching function here is updated and the tests still pass.
 */

const FEE_SCALE = 10000n;

/** Mirrors PoolCore.ride's isqrt() — 16-step unrolled Newton's method, floor result. */
export function isqrt(n: bigint): bigint {
  if (n < 0n) throw new Error('E_SQRT_NEG');
  if (n === 0n) return 0n;
  if (n <= 3n) return 1n;

  let x0: bigint;
  if (n >= 1000000000000000000n) x0 = n / 1000000000n;
  else if (n >= 10000000000000000n) x0 = n / 100000000n;
  else if (n >= 1000000000000n) x0 = n / 1000000n;
  else if (n >= 100000000n) x0 = n / 10000n;
  else if (n >= 10000n) x0 = n / 100n;
  else x0 = n;

  let x = x0;
  for (let i = 0; i < 16; i++) {
    const y = (x + n / x) / 2n;
    x = y < x ? y : x;
  }
  return x;
}

/** Mirrors PoolCore.ride's fraction()-based sqrtProduct — overflow-safe approximation of sqrt(a*b). */
export function sqrtProduct(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n;
  const sa = isqrt(a);
  const sb = isqrt(b);
  const approx = sa * sb;
  // fraction(approx+1, approx+1, a) <= b, i.e. floor((approx+1)^2 / a) <= b —
  // deliberately reproduces the known imprecision (can overshoot the true
  // floor(sqrt(a*b)) by exactly 1, never more, never undershoot below approx).
  if (approx > 0n && ((approx + 1n) * (approx + 1n)) / a <= b) return approx + 1n;
  return approx;
}

/** Mirrors SwapRouter.ride's swapExactIn/swapReadOnly output formula, post fraction(x,y,1) fix. */
export function swapAmountOut(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: bigint,
): bigint {
  const amountInWithFee = amountIn * (FEE_SCALE - feeBps);
  const denominator = reserveIn * FEE_SCALE + amountInWithFee;
  if (denominator <= 0n) return 0n;
  return (amountInWithFee * reserveOut) / denominator;
}

/** Mirrors PoolCore.ride's checkReserveCap — the ceiling introduced after the overflow audit finding. */
export const MAX_RESERVE = 100000000000000n;
export function exceedsReserveCap(r0: bigint, r1: bigint): boolean {
  return r0 > MAX_RESERVE || r1 > MAX_RESERVE;
}

/**
 * Mirrors the FIXED paymentAmount() fold — sums every payment matching the
 * target asset, rather than the old (buggy) "last match wins" behaviour.
 * assetId: null means native DCC, matching AttachedPayment.assetId semantics.
 */
export function sumMatchingPayments(
  payments: Array<{ assetId: string | null; amount: bigint }>,
  targetAssetId: string | null,
): { found: boolean; total: bigint } {
  let total = 0n;
  let found = false;
  for (const pmt of payments) {
    if (pmt.assetId === targetAssetId) {
      total += pmt.amount;
      found = true;
    }
  }
  return { found, total };
}
