import { Schema } from 'effect';
import * as S from '../../../utils/validation/schema';

export const result = Schema.Struct({
  asset_id: S.AssetId,
  asset_name: Schema.String,
  decimals: Schema.Number,
  description: Schema.optional(Schema.String),
  has_script: Schema.Boolean,
  issue_height: Schema.Number,
  issue_timestamp: Schema.DateFromSelf,
  min_sponsored_asset_fee: Schema.NullOr(S.Bignumber),
  reissuable: Schema.Boolean,
  sender: Schema.String,
  ticker: Schema.NullOr(Schema.String),
  total_quantity: Schema.optional(S.Bignumber),
});
