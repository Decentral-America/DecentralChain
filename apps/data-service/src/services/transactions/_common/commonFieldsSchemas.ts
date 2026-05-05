import { Schema } from 'effect';
import * as S from '../../../utils/validation/schema';

export default {
  fee: S.Bignumber,
  height: Schema.Number,
  id: S.Base58,
  proofs: Schema.Array(Schema.Unknown),
  sender: S.Base58,
  sender_public_key: S.Base58,
  signature: Schema.NullOr(S.Base58),
  status: Schema.String,
  time_stamp: Schema.DateFromSelf,
  tx_type: Schema.Number,
  tx_version: Schema.NullOr(Schema.Number),
  uid: S.Bignumber,
};
