// @ts-nocheck
import { type BigNumber } from '@decentralchain/data-entities';
import { compose, curry, groupBy, map, sort, toPairs } from 'ramda';
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

/** addMissingCandles :: Interval -> Date -> Date
 * -> Map String CandleDbResponse[]-> Map String CandleDbResponse[] */
export const addMissingCandles: any = curry(
  (interval: Interval, timeStart: Date, timeEnd: Date) =>
    (
      candlesGroupedByTime: Record<string, CandleDbResponse[]>,
    ): Record<string, CandleDbResponse[]> => {
      const end = timeEnd;
      const res = { ...candlesGroupedByTime };
      for (
        let it = ceil(interval, timeStart) as unknown as Date;
        it <= end;
        it = floor(interval, add(interval, it) as unknown as Date) as unknown as Date
      ) {
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
  (
    compose(
      (items: CandleInfo[]) => ({
        isLastPage: false,
        items: items,
      }),
      map(transformCandle(request.interval)),
      sort(
        (a: [string, RawCandle], b: [string, RawCandle]): number =>
          new Date(a[0]).valueOf() - new Date(b[0]).valueOf(),
      ),
      toPairs,
      map(concatAll(candleMonoid)),
      addMissingCandles(request.interval, request.timeStart, request.timeEnd),
      groupBy(
        (candle: CandleDbResponse): string =>
          truncToMinutes(
            floor(request.interval, candle.time_start as Date) as unknown as Date,
          ) as unknown as string,
      ),
    ) as any
  )(result) as SearchedItems<CandleInfo>;

export const transformLastResult = (
  result: CandleDbResponse[],
  request: CandlesSearchRequest,
): SearchedItems<CandleInfo> =>
  (
    compose(
      (items: CandleInfo[]) => ({
        isLastPage: false,
        items: items,
      }),
      map(transformCandle(request.interval)),
      toPairs,
      map(concatAll(candleMonoid)),
      groupBy(
        (candle: CandleDbResponse): string =>
          truncToMinutes(
            floor(request.interval, candle.time_start as Date) as unknown as Date,
          ) as unknown as string,
      ),
    ) as any
  )(result) as SearchedItems<CandleInfo>;
