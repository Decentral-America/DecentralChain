import bs58 from 'bs58';
import { compareUint8Arrays } from './utils.js';

import MAINNET_RAW_DATA from './mainnet.json' with { type: 'json' };
import TESTNET_RAW_DATA from './testnet.json' with { type: 'json' };
import ARBITRARY_RAW_DATA from './arbitrary.json' with { type: 'json' };

/** @type {readonly string[]} Priority list for DecentralChain mainnet */
export const MAINNET_DATA = Object.freeze(MAINNET_RAW_DATA.map((d) => d.id));

/** @type {readonly string[]} Priority list for DecentralChain testnet */
export const TESTNET_DATA = Object.freeze(TESTNET_RAW_DATA.map((d) => d.id));

/** @type {readonly string[]} Additional asset ordering data */
export const ARBITRARY_DATA = Object.freeze(ARBITRARY_RAW_DATA.map((d) => d.id));

/**
 * Determines the correct ordering of an asset pair on the DEX.
 *
 * Ordering rules:
 * 1. Both assets in the priority list → higher-index asset becomes the price asset
 * 2. One asset in the list → the listed asset becomes the price asset
 * 3. Neither asset in the list → ordered deterministically by Base58 byte comparison
 *
 * @param {string[]} predefinedList - Array of asset IDs ordered by priority
 * @param {string} first - First asset ID
 * @param {string} second - Second asset ID
 * @returns {[string, string]} Tuple of [amountAsset, priceAsset]
 * @throws {TypeError} If predefinedList is not an array or asset IDs are not strings
 */
const orderPair = (predefinedList, first, second) => {
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
 *
 * @param {Function} f - Function to curry
 * @returns {Function} Curried function
 */
const curry = (f) => {
  const totalargs = f.length;
  const partial =
    (args, fn) =>
    (...rest) =>
      fn(...args, ...rest);
  const fn = (...args) =>
    args.length < totalargs ? partial(args, fn) : f(...args.slice(0, totalargs));
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
 *
 * @type {import('./index.d.ts').CreateOrderPair}
 */
export const createOrderPair = curry(orderPair);
