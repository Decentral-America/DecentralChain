import { Schema } from 'effect';
import * as S from '../../../../utils/validation/schema';

export const result = Schema.Struct({
  amount: S.Bignumber,
  // genesis txs do not have a sender — omit sender + sender_public_key from commonFields
  fee: S.Bignumber,
  height: Schema.Number,
  id: S.Base58,
  proofs: Schema.Array(Schema.Unknown),
  recipient: Schema.String,
  signature: Schema.NullOr(S.Base58),
  status: Schema.String,
  time_stamp: Schema.DateFromSelf,
  tx_type: Schema.Number,
  tx_version: Schema.NullOr(Schema.Number),
  uid: S.Bignumber,
});
