import { BigNumber } from '@decentralchain/data-entities';

import { convertAmount, convertPrice } from '../satoshi';

test('convertAmount should multiply by 10^-decimals', () => {
  expect(convertAmount(8, new BigNumber(100000000))).toEqual(new BigNumber(1));
  expect(convertAmount(2, new BigNumber(1234))).toEqual(new BigNumber(12.34));
  expect(convertAmount(2, new BigNumber(0))).toEqual(new BigNumber(0));
  expect(convertAmount(0, new BigNumber(1))).toEqual(new BigNumber(1));
});

test('convertPrice should multiply by 10^-8 + aDecimals - pDecimals', () => {
  expect(convertPrice(8, 8, new BigNumber(100000000))).toEqual(new BigNumber(1));
  expect(convertPrice(8, 2, new BigNumber(100))).toEqual(new BigNumber(1));
  expect(convertPrice(8, 0, new BigNumber(100))).toEqual(new BigNumber(100));
});

test('functions throw on invalid corner cases', () => {
  // DCC BigNumber intentionally rejects NaN and Infinity (financial safety)
  expect(() => convertAmount(0, new BigNumber(NaN))).toThrow('Invalid BigNumber value');
  expect(() => convertAmount(0, new BigNumber(Infinity))).toThrow('Infinite values');

  expect(() => convertPrice(0, 0, new BigNumber(NaN))).toThrow('Invalid BigNumber value');
  expect(() => convertPrice(0, 0, new BigNumber(Infinity))).toThrow('Infinite values');
});
