import { Schema } from 'effect';
import { CandleInterval } from '../../../types';
import * as S from '../../../utils/validation/schema';

export const inputSearch = S.Period;

export const output = Schema.Struct({
  amount_asset_id: S.AssetId,
  close: S.Bignumber,
  high: S.Bignumber,
  interval: Schema.Enums(CandleInterval),
  low: S.Bignumber,
  max_height: Schema.Number,
  open: S.Bignumber,
  price_asset_id: S.AssetId,
  quote_volume: S.Bignumber,
  time_start: Schema.DateFromSelf,
  txs_count: Schema.Number,
  volume: S.Bignumber,
  weighted_average_price: S.Bignumber,
});
