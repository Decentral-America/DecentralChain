import { Schema } from 'effect';
import * as S from '../../../../utils/validation/schema';
import commonFields from '../../_common/commonFieldsSchemas';

export const result = Schema.Struct({
  ...commonFields,
  asset_id: S.AssetId,
  script: Schema.NullOr(Schema.String),
});
