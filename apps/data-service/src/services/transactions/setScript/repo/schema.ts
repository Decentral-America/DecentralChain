// @ts-nocheck
import { Schema } from 'effect';
import commonFields from '../../_common/commonFieldsSchemas';

export const result = Schema.Struct({
  ...commonFields,
  script: Schema.NullOr(Schema.String),
});
