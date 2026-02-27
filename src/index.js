import bs58 from 'bs58';
import { compareUint8Arrays } from './utils.js';

import MAINNET_RAW_DATA from './mainnet.json' with { type: 'json' };
import TESTNET_RAW_DATA from './testnet.json' with { type: 'json' };
import ARBITRARY_RAW_DATA from './arbitrary.json' with { type: 'json' };

export const MAINNET_DATA = MAINNET_RAW_DATA.map((d) => d.id);
export const TESTNET_DATA = TESTNET_RAW_DATA.map((d) => d.id);
export const ARBITRARY_DATA = ARBITRARY_RAW_DATA.map((d) => d.id);

const orderPair = (predefinedList, first, second) => {
  const firstListIndex = predefinedList.indexOf(first);
  const secondListIndex = predefinedList.indexOf(second);
  const isFirstInList = Boolean(~firstListIndex);
  const isSecondInList = Boolean(~secondListIndex);
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

export const createOrderPair = curry(orderPair);
