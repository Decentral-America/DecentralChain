import { Schema } from 'effect';
import * as S from '../../../utils/validation/schema';

export const output = Schema.Struct({
  address: Schema.NullOr(S.Base58),
  alias: Schema.String,
  duplicates: Schema.optional(S.Bignumber),
});
