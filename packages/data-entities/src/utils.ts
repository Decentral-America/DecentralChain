import { BigNumber } from '@decentralchain/bignumber';

/**
 * Convert a value to a BigNumber instance with consistent error messages.
 *
 * If the value is already a BigNumber, it is returned as-is.
 * Otherwise, a new BigNumber is constructed from the given string or number.
 *
 * The underlying BigNumber constructor may throw its own errors (e.g.
 * `[BigNumber Error] Not a number: ...`).  This wrapper catches all
 * construction errors and normalises them into two predictable forms:
 *
 * - `Invalid numeric value: <input>`   — for NaN / non-numeric input
 * - `Non-finite numeric value: <input>` — for ±Infinity
 *
 * @param some - A string, number, or BigNumber value to convert.
 * @returns A BigNumber instance representing the given value.
 * @throws {Error} If the resulting BigNumber is NaN or not finite.
 */
export function toBigNumber(some: string | number | BigNumber): BigNumber {
  let result: BigNumber;
  try {
    result = some instanceof BigNumber ? some : new BigNumber(some);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Detect Infinity-related errors thrown by the BigNumber constructor
    if (
      msg.includes('Infinite') ||
      msg.includes('not finite') ||
      (typeof some === 'number' && !Number.isFinite(some) && !Number.isNaN(some))
    ) {
      throw new Error(`Non-finite numeric value: ${String(some)} — Infinity is not allowed`, {
        cause: e,
      });
    }
    throw new Error(`Invalid numeric value: ${String(some)} — cannot convert to BigNumber`, {
      cause: e,
    });
  }

  if (result.isNaN()) {
    throw new Error(`Invalid numeric value: ${String(some)} — cannot convert to BigNumber`);
  }
  if (!result.isFinite()) {
    throw new Error(`Non-finite numeric value: ${String(some)} — Infinity is not allowed`);
  }
  return result;
}
