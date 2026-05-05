import { Schema } from 'effect';
import * as S from '../../../../utils/validation/schema';
import commonFields from '../../_common/commonFieldsSchemas';

const DataEntryValue = Schema.Union(S.Bignumber64, Schema.String, Schema.Boolean, Schema.Null);

const DataEntryType = Schema.NullOr(Schema.Literal('integer', 'boolean', 'string', 'binary'));

export const result = Schema.Struct({
  ...commonFields,
  data: Schema.Array(
    Schema.Struct({
      key: Schema.String,
      type: DataEntryType,
      value: DataEntryValue,
    }),
  ),
});
