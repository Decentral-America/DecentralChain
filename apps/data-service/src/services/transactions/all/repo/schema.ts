import { Schema } from 'effect';
import * as S from '../../../../utils/validation/schema';

export const result = Schema.Struct({
  id: S.Base58,
  time_stamp: Schema.DateFromSelf,
  tx_type: Schema.Number,
  uid: S.Bignumber,
});
