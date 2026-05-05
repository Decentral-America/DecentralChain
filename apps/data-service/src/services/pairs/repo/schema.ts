import { Schema } from 'effect';
import * as S from '../../../utils/validation/schema';

export const result = Schema.Struct({
  amount_asset_id: S.AssetId,
  first_price: S.Bignumber,
  high: S.Bignumber,
  last_price: S.Bignumber,
  low: S.Bignumber,
  price_asset_id: S.AssetId,
  quote_volume: S.Bignumber,
  txs_count: Schema.Number,
  volume: S.Bignumber,
  volume_waves: Schema.NullOr(S.Bignumber),
  weighted_average_price: S.Bignumber,
});
