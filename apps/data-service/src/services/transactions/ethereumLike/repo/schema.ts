// @ts-nocheck
import { Schema } from 'effect';
import commonFields from '../../_common/commonFieldsSchemas';

export const result = Schema.Struct({
  ...commonFields,
  bytes: Schema.instanceOf(Buffer),
  function_name: Schema.NullOr(Schema.String),
});
