import { type BigNumber } from '@decentralchain/data-entities';
import { groupBy, map, sort } from 'ramda';
import { type CandleInfo, type Interval, type SearchedItems, Unit } from '../../../types';
import { add, ceil, floor, trunc } from '../../../utils/date';
import { concatAll } from '../../../utils/fp/concatAll';
import { type CandlesSearchRequest } from '../repo';
import { candleMonoid } from './candleMonoid';

const truncToMinutes = trunc(Unit.Minute);

export type CandleDbResponse = {
  time_start: Date;
  amount_asset_id: string;
  price_asset_id: string;
  max_height: number;
  open: BigNumber;
  high: BigNumber;
  low: BigNumber;
  close: BigNumber;
  volume: BigNumber;
  quote_volume: BigNumber;
  weighted_average_price: BigNumber;
  txs_count: number;
  interval: string;
};

export type RawCandle = {
  time_start: Date | null;
  max_height: number;
  open: BigNumber | null;
  high: BigNumber;
  low: BigNumber;
  close: BigNumber | null;
  volume: BigNumber;
  quote_volume: BigNumber;
  weighted_average_price: BigNumber;
  txs_count: number;
};

export const transformCandle =
  (candleInterval: Interval) =>
  ([time, c]: [string, RawCandle]): CandleInfo => {
    const timeClose = new Date(new Date(time).valueOf() + candleInterval.length - 1);

    return {
      ...(map((v) => (c.txs_count === 0 ? null : v), {
        close: c.close,
        high: c.high,
        low: c.low,
        maxHeight: c.max_height,
        open: c.open,
        quoteVolume: c.quote_volume,
        volume: c.volume,
        weightedAveragePrice: c.weighted_average_price,
      }) as Partial<CandleInfo>),
      time: new Date(time),
      timeClose,
      txsCount: c.txs_count,
    } as CandleInfo;
  };

type CandlesMap = Partial<Record<string, CandleDbResponse[]>>;

/** addMissingCandles :: Interval -> Date -> Date -> CandlesMap -> CandlesMap */
export function addMissingCandles(
  interval: Interval,
): (timeStart: Date, timeEnd: Date) => (grouped: CandlesMap) => CandlesMap;
export function addMissingCandles(
  interval: Interval,
  timeStart: Date,
  timeEnd: Date,
): (grouped: CandlesMap) => CandlesMap;
export function addMissingCandles(
  interval: Interval,
  timeStart?: Date,
  timeEnd?: Date,
):
  | ((timeStart: Date, timeEnd: Date) => (grouped: CandlesMap) => CandlesMap)
  | ((grouped: CandlesMap) => CandlesMap) {
  const impl =
    (ts: Date, te: Date) =>
    (candlesGroupedByTime: CandlesMap): CandlesMap => {
      const res = { ...candlesGroupedByTime };
      for (let it = ceil(interval, ts); it <= te; it = floor(interval, add(interval, it))) {
        const cur = truncToMinutes(it);
        if (!res[cur]) {
          res[cur] = [];
        }
      }
      return res;
    };
  if (timeStart === undefined || timeEnd === undefined) {
    return impl;
  }
  return impl(timeStart, timeEnd);
}

export const transformResults = (
  result: CandleDbResponse[],
  request: CandlesSearchRequest,
): SearchedItems<CandleInfo> => {
  const grouped = groupBy(
    (candle: CandleDbResponse): string =>
      truncToMinutes(floor(request.interval, candle.time_start)),
    result,
  );
  const withMissing = addMissingCandles(
    request.interval,
    request.timeStart,
    request.timeEnd,
  )(grouped);
  const pairs: [string, RawCandle][] = Object.entries(withMissing)
    .filter((entry): entry is [string, CandleDbResponse[]] => entry[1] !== undefined)
    .map(([key, candles]) => [key, concatAll(candleMonoid)(candles as RawCandle[])]);
  const sorted = sort(
    (a: [string, RawCandle], b: [string, RawCandle]): number =>
      new Date(a[0]).valueOf() - new Date(b[0]).valueOf(),
    pairs,
  );
  return {
    isLastPage: false,
    items: sorted.map(transformCandle(request.interval)),
  };
};

export const transformLastResult = (
  result: CandleDbResponse[],
  request: CandlesSearchRequest,
): SearchedItems<CandleInfo> => {
  const grouped = groupBy(
    (candle: CandleDbResponse): string =>
      truncToMinutes(floor(request.interval, candle.time_start)),
    result,
  );
  const pairs: [string, RawCandle][] = Object.entries(grouped)
    .filter((entry): entry is [string, CandleDbResponse[]] => entry[1] !== undefined)
    .map(([key, candles]) => [key, concatAll(candleMonoid)(candles as RawCandle[])]);
  return {
    isLastPage: false,
    items: pairs.map(transformCandle(request.interval)),
  };
};
