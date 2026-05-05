import { Schema } from 'effect';
import * as S from '../../../../utils/validation/schema';
import commonFields from '../../_common/commonFieldsSchemas';

export const result = Schema.Struct({
  ...commonFields,
  asset_id: S.Base58,
  min_sponsored_asset_fee: Schema.NullOr(S.Bignumber),
});
