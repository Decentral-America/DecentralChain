import { BigNumber } from '@decentralchain/bignumber';

/**
 * Convert a value to a BigNumber instance.
 *
 * If the value is already a BigNumber, it is returned as-is.
 * Otherwise, a new BigNumber is constructed from the given string or number.
 *
 * @param some - A string, number, or BigNumber value to convert.
 * @returns A BigNumber instance representing the given value.
 */
export function toBigNumber(some: string | number | BigNumber): BigNumber {
  return some instanceof BigNumber ? some : new BigNumber(some);
}
