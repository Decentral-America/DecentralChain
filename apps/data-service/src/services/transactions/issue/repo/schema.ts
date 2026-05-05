import { Schema } from 'effect';
import * as S from '../../../../utils/validation/schema';
import commonFields from '../../_common/commonFieldsSchemas';

export const result = Schema.Struct({
  ...commonFields,
  asset_id: S.AssetId,
  asset_name: Schema.String,
  decimals: Schema.Number,
  description: Schema.String,
  quantity: S.Bignumber,
  reissuable: Schema.Boolean,
  script: Schema.NullOr(Schema.String),
});
