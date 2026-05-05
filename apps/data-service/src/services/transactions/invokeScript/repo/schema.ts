import { Schema } from 'effect';
import * as S from '../../../../utils/validation/schema';
import commonFields from '../../_common/commonFieldsSchemas';

export const result = Schema.Struct({
  ...commonFields,
  call: Schema.NullOr(
    Schema.Struct({
      args: Schema.Array(Schema.Struct({ type: Schema.String, value: Schema.Unknown })),
      function: S.NoNullChars,
    }),
  ),
  dapp: Schema.String,
  fee_asset_id: Schema.String,
  payment: Schema.Array(
    Schema.Struct({
      amount: S.Bignumber,
      assetId: Schema.NullOr(S.AssetId),
    }),
  ),
});
