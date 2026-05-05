import { Schema } from 'effect';
import * as S from '../../../../utils/validation/schema';
import commonFields from '../../_common/commonFieldsSchemas';

export const result = Schema.Struct({
  ...commonFields,
  asset_id: S.AssetId,
  attachment: Schema.String,
  transfers: Schema.Array(
    Schema.Struct({
      amount: S.Bignumber,
      recipient: Schema.NullOr(Schema.String),
    }),
  ),
});
