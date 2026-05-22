import { Either, pipe } from 'effect';
import { type Knex, knex } from 'knex';
import { CandleInterval, type Interval } from '../../../../types';
import { unsafeIntervalsFromStrings } from '../../../../utils/interval';
import { type CandlesSearchRequest } from '../../repo';
import { highestDividerLessThan } from './utils';

const pg = knex({ client: 'pg' });

const FIELDS = {
  amount_asset_id: 'c.amount_asset_id',
  close: pg.raw('(c.close)::numeric'),
  high: pg.raw('(c.high)::numeric'),
  interval: 'c.interval',
  low: pg.raw('(c.low)::numeric'),
  max_height: 'c.max_height',
  open: pg.raw('(c.open)::numeric'),
  price_asset_id: 'c.price_asset_id',
  quote_volume: pg.raw('(c.quote_volume)::numeric'),
  time_start: 'c.time_start',
  txs_count: 'c.txs_count',
  volume: pg.raw('(c.volume)::numeric'),
  weighted_average_price: pg.raw('(c.weighted_average_price)::numeric'),
};

const DIVIDERS = [
  CandleInterval.Minute1,
  CandleInterval.Minute5,
  CandleInterval.Minute15,
  CandleInterval.Minute30,
  CandleInterval.Hour1,
  CandleInterval.Hour2,
  CandleInterval.Hour3,
  CandleInterval.Hour4,
  CandleInterval.Hour6,
  CandleInterval.Hour12,
  CandleInterval.Day1,
  CandleInterval.Week1,
  CandleInterval.Month1,
];

export interface CandleSelectionParams {
  amountAsset: string;
  priceAsset: string;
  timeStart: Date;
  timeEnd: Date;
  interval: Interval;
  matcher: string;
}

export const selectCandles = ({
  amountAsset,
  priceAsset,
  timeStart,
  timeEnd,
  matcher,
  interval,
}: CandleSelectionParams): Knex.QueryBuilder =>
  pg({ c: 'candles' })
    .select(FIELDS)
    .where('amount_asset_id', amountAsset)
    .where('price_asset_id', priceAsset)
    .where('time_start', '>=', timeStart.toISOString())
    .where('time_start', '<=', timeEnd.toISOString())
    .where('matcher_address', matcher)
    .where(
      'interval',
      // should always be valid after validation
      pipe(
        highestDividerLessThan(interval, unsafeIntervalsFromStrings(DIVIDERS)),
        Either.match({
          onLeft: () => CandleInterval.Minute1,
          onRight: (i) => i.source,
        }),
      ),
    );

export const search = ({
  amountAsset,
  priceAsset,
  timeStart,
  timeEnd,
  interval,
  matcher,
}: CandlesSearchRequest): string =>
  pg('candles')
    .select(FIELDS)
    .from({
      c: selectCandles({
        amountAsset,
        interval,
        matcher,
        priceAsset,
        timeEnd,
        timeStart,
      }),
    } as unknown as string)
    .orderBy('c.time_start', 'asc')
    .toString();

export const selectLastCandle = ({
  amountAsset,
  priceAsset,
  timeEnd,
  matcher,
  interval,
}: CandleSelectionParams): Knex.QueryBuilder =>
  pg({ c: 'candles' })
    .select(FIELDS)
    .where('amount_asset_id', amountAsset)
    .where('price_asset_id', priceAsset)
    .where('time_start', '<=', timeEnd.toISOString())
    .where('matcher_address', matcher)
    .where('txs_count', '>', 0)
    .where(
      'interval',
      // should always be valid after validation
      pipe(
        highestDividerLessThan(interval, unsafeIntervalsFromStrings(DIVIDERS)),
        Either.match({
          onLeft: () => CandleInterval.Minute1,
          onRight: (i) => i.source,
        }),
      ),
    );

export const searchLast = ({
  amountAsset,
  priceAsset,
  timeStart,
  timeEnd,
  interval,
  matcher,
}: CandlesSearchRequest): string =>
  pg('candles')
    .select(FIELDS)
    .from({
      c: selectLastCandle({
        amountAsset,
        interval,
        matcher,
        priceAsset,
        timeEnd,
        timeStart,
      }),
    } as unknown as string)
    .orderBy('c.time_start', 'desc')
    .limit(1)
    .toString();

export const sql = {
  search,
  searchLast,
};
