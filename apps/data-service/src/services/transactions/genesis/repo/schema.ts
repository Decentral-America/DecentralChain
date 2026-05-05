import { Schema } from 'effect';
import { omit } from 'ramda';
import * as S from '../../../../utils/validation/schema';
import commonFields from '../../_common/commonFieldsSchemas';

export const result = Schema.Struct({
  // genesis txs do not have a sender
  ...omit(['sender', 'sender_public_key'], commonFields),
  amount: S.Bignumber,
  recipient: Schema.String,
} as any);
