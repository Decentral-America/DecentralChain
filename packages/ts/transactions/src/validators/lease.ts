import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isEq,
  isNaturalNumberLike,
  isNumber,
  isPublicKey,
  isRecipient,
  orEq,
  validateByShema,
} from './validators';

const leaseScheme = {
  amount: isNaturalNumberLike,
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  recipient: isRecipient,
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.LEASE),
  version: orEq([undefined, 2, 3]),
};

export const leaseValidator = validateByShema(leaseScheme, getError);
