import { Schema } from 'effect';
import commonFields from '../../_common/commonFieldsSchemas';

export const result = Schema.Struct({
  ...commonFields,
  alias: Schema.String,
});
