import { type BigNumber } from '@decentralchain/data-entities';
import { compose, curry, groupBy, map, merge, sort, toPairs } from 'ramda';
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
      ...map((v) => (c.txs_count === 0 ? null : v), {
        close: c.close,
        high: c.high,
        low: c.low,
        maxHeight: c.max_height,
        open: c.open,
        quoteVolume: c.quote_volume,
        volume: c.volume,
        weightedAveragePrice: c.weighted_average_price,
      }),
      time: new Date(time),
      timeClose,
      txsCount: c.txs_count,
    };
  };

/** addMissingCandles :: Interval -> Date -> Date
 * -> Map String CandleDbResponse[]-> Map String CandleDbResponse[] */
export const addMissingCandles = curry(
  (interval: Interval, timeStart: Date, timeEnd: Date) =>
    (
      candlesGroupedByTime: Record<string, CandleDbResponse[]>,
    ): Record<string, CandleDbResponse[]> => {
      const end = timeEnd;
      const res = merge({}, candlesGroupedByTime);
      for (let it = ceil(interval, timeStart); it <= end; it = floor(interval, add(interval, it))) {
        const cur = truncToMinutes(it);

        if (!res[cur]) {
          res[cur] = [];
        }
      }

      return res;
    },
);

export const transformResults = (
  result: CandleDbResponse[],
  request: CandlesSearchRequest,
): SearchedItems<CandleInfo> =>
  compose<
    CandleDbResponse[],
    Record<string, CandleDbResponse[]>,
    Record<string, RawCandle[]>,
    Record<string, RawCandle>,
    [string, RawCandle][],
    [string, RawCandle][],
    CandleInfo[],
    SearchedItems<CandleInfo>
  >(
    (items) => ({
      isLastPage: false,
      items: items,
    }),
    map(transformCandle(request.interval)),
    sort((a, b): number => new Date(a[0]).valueOf() - new Date(b[0]).valueOf()),
    toPairs,
    map<Record<string, RawCandle[]>, Record<string, RawCandle>>(concatAll(candleMonoid)),
    addMissingCandles(request.interval, request.timeStart, request.timeEnd),
    groupBy((candle) => truncToMinutes(floor(request.interval, candle.time_start))),
  )(result);

export const transformLastResult = (
  result: CandleDbResponse[],
  request: CandlesSearchRequest,
): SearchedItems<CandleInfo> =>
  compose<
    CandleDbResponse[],
    Record<string, RawCandle[]>,
    Record<string, RawCandle>,
    [string, RawCandle][],
    CandleInfo[],
    SearchedItems<CandleInfo>
  >(
    (items) => ({
      isLastPage: false,
      items: items,
    }),
    map(transformCandle(request.interval)),
    toPairs,
    map<Record<string, RawCandle[]>, Record<string, RawCandle>>(concatAll(candleMonoid)),
    groupBy((candle) => truncToMinutes(floor(request.interval, candle.time_start))),
  )(result);
