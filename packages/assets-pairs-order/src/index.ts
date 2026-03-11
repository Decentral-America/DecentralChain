import bs58 from 'bs58';
import ARBITRARY_RAW_DATA from './arbitrary.json' with { type: 'json' };

import MAINNET_RAW_DATA from './mainnet.json' with { type: 'json' };
import TESTNET_RAW_DATA from './testnet.json' with { type: 'json' };

/**
 * Compares two Uint8Arrays lexicographically, byte by byte.
 *
 * @param arr1 - First byte array
 * @param arr2 - Second byte array
 * @returns `true` if arr1 is lexicographically greater than arr2, `false` otherwise (including when equal)
 */
export const compareUint8Arrays = (arr1: Uint8Array, arr2: Uint8Array): boolean => {
  const len = Math.min(arr1.length, arr2.length);
  for (let i = 0; i < len; i++) {
    const a = arr1[i] as number;
    const b = arr2[i] as number;
    if (a > b) return true;
    if (a < b) return false;
  }
  return arr1.length > arr2.length;
};

/** A tuple of [amountAsset, priceAsset] */
export type TPair = readonly [amountAsset: string, priceAsset: string];

/** A function that orders two asset IDs into [amountAsset, priceAsset] */
export type TOrderPair = (a: string, b: string) => TPair;

/** Overloaded createOrderPair interface supporting curried and full application */
export interface CreateOrderPair {
  /** Partial application: returns a function that orders two assets */
  (predefinedList: readonly string[]): TOrderPair;
  /** Full application: returns the ordered pair directly */
  (predefinedList: readonly string[], a: string, b: string): TPair;
}

/** Priority list for DecentralChain mainnet */
export const MAINNET_DATA: readonly string[] = Object.freeze(MAINNET_RAW_DATA.map((d) => d.id));

/** Priority list for DecentralChain testnet */
export const TESTNET_DATA: readonly string[] = Object.freeze(TESTNET_RAW_DATA.map((d) => d.id));

/** Additional asset ordering data */
export const ARBITRARY_DATA: readonly string[] = Object.freeze(ARBITRARY_RAW_DATA.map((d) => d.id));

/**
 * Determines the correct ordering of an asset pair on the DEX.
 *
 * Ordering rules:
 * 1. Both assets in the priority list → lower-index (higher-priority) asset becomes the price asset
 * 2. One asset in the list → the listed asset becomes the price asset
 * 3. Neither asset in the list → ordered deterministically by Base58 byte comparison
 *
 * @param predefinedList - Array of asset IDs ordered by priority
 * @param first - First asset ID
 * @param second - Second asset ID
 * @returns Tuple of [amountAsset, priceAsset]
 * @throws {TypeError} If predefinedList is not an array or asset IDs are not strings
 */
const orderPair = (predefinedList: readonly string[], first: string, second: string): TPair => {
  if (!Array.isArray(predefinedList)) {
    throw new TypeError(`Expected predefinedList to be an array, got ${typeof predefinedList}`);
  }
  if (typeof first !== 'string') {
    throw new TypeError(`Expected first asset ID to be a string, got ${typeof first}`);
  }
  if (typeof second !== 'string') {
    throw new TypeError(`Expected second asset ID to be a string, got ${typeof second}`);
  }

  const firstListIndex = predefinedList.indexOf(first);
  const secondListIndex = predefinedList.indexOf(second);
  const isFirstInList = firstListIndex !== -1;
  const isSecondInList = secondListIndex !== -1;

  switch (true) {
    case isFirstInList && isSecondInList:
      return firstListIndex > secondListIndex ? [first, second] : [second, first];
    case isFirstInList && !isSecondInList:
      return [second, first];
    case !isFirstInList && isSecondInList:
      return [first, second];
    default:
      return compareUint8Arrays(bs58.decode(first), bs58.decode(second))
        ? [first, second]
        : [second, first];
  }
};

/**
 * Creates a curried function that can be called with:
 * - `createOrderPair(data)` → returns `(a, b) => [amount, price]`
 * - `createOrderPair(data, a, b)` → returns `[amount, price]`
 */
const curry = (f: (...args: never[]) => unknown) => {
  const totalargs = f.length;
  const partial =
    (args: unknown[], fn: (...a: unknown[]) => unknown) =>
    (...rest: unknown[]) =>
      fn(...args, ...rest);
  const fn = (...args: unknown[]): unknown =>
    args.length < totalargs ? partial(args, fn) : f(...(args.slice(0, totalargs) as never[]));
  return fn;
};

/**
 * Creates an ordering function from a priority list. Supports currying.
 *
 * @example
 * // Partial application
 * const orderPair = createOrderPair(MAINNET_DATA);
 * const [amount, price] = orderPair('assetA', 'assetB');
 *
 * @example
 * // Full application
 * const [amount, price] = createOrderPair(MAINNET_DATA, 'assetA', 'assetB');
 */
export const createOrderPair: CreateOrderPair = curry(orderPair) as CreateOrderPair;
