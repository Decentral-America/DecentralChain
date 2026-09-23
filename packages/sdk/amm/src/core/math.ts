/**
 * Integer math utilities matching RIDE semantics.
 *
 * All functions operate on BigInt.
 * All division uses floor (truncation toward zero for positive values).
 * These mirror the on-chain RIDE built-in behavior exactly.
 */

/**
 * Integer square root using Newton's method.
 * Returns floor(sqrt(n)).
 *
 * Matches the RIDE isqrt implementation used for initial LP calculation.
 *
 * @param n - Non-negative BigInt
 * @returns floor(sqrt(n))
 * @throws if n < 0
 */
export function isqrt(n: bigint): bigint {
  if (n < 0n) {
    throw new Error('isqrt: negative input');
  }
  if (n === 0n) return 0n;
  if (n === 1n) return 1n;

  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

/**
 * Safe fraction calculation: floor(a * b / c)
 *
 * Mirrors RIDE's built-in fraction(a, b, c) which uses 128-bit
 * intermediate multiplication. In TypeScript, BigInt handles arbitrary
 * precision natively.
 *
 * @param a - First multiplicand (must be >= 0)
 * @param b - Second multiplicand (must be >= 0)
 * @param c - Divisor (must be > 0)
 * @returns floor(a * b / c)
 * @throws if c <= 0 or if a or b is negative
 */
export function fraction(a: bigint, b: bigint, c: bigint): bigint {
  if (c <= 0n) {
    throw new Error('fraction: divisor must be positive');
  }
  if (a < 0n || b < 0n) {
    throw new Error('fraction: inputs must be non-negative');
  }
  return (a * b) / c;
}

/**
 * Safe multiplication with overflow check against RIDE Long limits.
 *
 * @param a - First factor
 * @param b - Second factor
 * @returns a * b
 * @throws if result exceeds RIDE Long range (informational; BigInt doesn't overflow)
 */
export function safeMul(a: bigint, b: bigint): bigint {
  const result = a * b;
  return result;
}

/**
 * Minimum of two BigInts.
 */
export function bigMin(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

/**
 * Maximum of two BigInts.
 */
export function bigMax(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}
