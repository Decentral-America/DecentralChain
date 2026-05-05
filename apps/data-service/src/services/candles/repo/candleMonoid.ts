import { BigNumber } from '@decentralchain/data-entities';
import { type Monoid } from '../../../types/monoid';
import { type RawCandle } from './transformResults';

// common
export const leftNotNullMonoid: Monoid<any> = {
  concat: (a: any, b: any): any => a || b,
  empty: null,
};

export const rightNotNullMonoid: Monoid<any> = {
  concat: (a: any, b: any): any => b || a,
  empty: null,
};

export const sumMonoid: Monoid<number> = {
  concat: (a: number, b: number): number => a + b,
  empty: 0,
};

export const bigNumberPlusMonoid: Monoid<BigNumber> = {
  concat: (a: BigNumber, b: BigNumber): BigNumber => a.plus(b),
  empty: new BigNumber(0),
};

export const maxMonoid: Monoid<number> = {
  concat: (a: number, b: number): number => Math.max(a, b),
  empty: 0,
};

export const bigNumberMinMonoid: Monoid<BigNumber> = {
  concat: (a: BigNumber, b: BigNumber): BigNumber => (a.comparedTo(b) === 1 ? b : a),
  empty: new BigNumber(+Infinity),
};

export const bigNumberMaxMonoid = {
  concat: (a: BigNumber, b: BigNumber): BigNumber => (a.comparedTo(b) === 1 ? a : b),
  empty: new BigNumber(-Infinity),
};

// individual
export const weightedAveragePriceMonoid: Monoid<any> = {
  concat: (a: RawCandle, b: RawCandle): BigNumber =>
    a.quote_volume.plus(b.quote_volume).dividedBy(a.volume.plus(b.volume)),
  empty: new BigNumber(0),
};

export const candleMonoid: Monoid<RawCandle> = {
  concat: (a, b) => ({
    close: rightNotNullMonoid.concat(a.close, b.close),
    high: bigNumberMaxMonoid.concat(a.high, b.high),
    low: bigNumberMinMonoid.concat(a.low, b.low),
    max_height: maxMonoid.concat(a.max_height, b.max_height),
    open: leftNotNullMonoid.concat(a.open, b.open),
    quote_volume: bigNumberPlusMonoid.concat(a.quote_volume, b.quote_volume),
    time_start: leftNotNullMonoid.concat(a.time_start, b.time_start),
    txs_count: sumMonoid.concat(a.txs_count, b.txs_count),
    volume: bigNumberPlusMonoid.concat(a.volume, b.volume),
    weighted_average_price: weightedAveragePriceMonoid.concat(a, b),
  }),
  empty: {
    close: rightNotNullMonoid.empty,
    high: bigNumberMaxMonoid.empty,
    low: bigNumberMinMonoid.empty,
    max_height: maxMonoid.empty,
    open: leftNotNullMonoid.empty,
    quote_volume: bigNumberPlusMonoid.empty,
    time_start: leftNotNullMonoid.empty,
    txs_count: sumMonoid.empty,
    volume: bigNumberPlusMonoid.empty,
    weighted_average_price: weightedAveragePriceMonoid.empty,
  },
};
