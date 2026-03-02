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
  type: isEq(TRANSACTION_TYPE.LEASE),
  version: orEq([undefined, 2, 3]),
  senderPublicKey: isPublicKey,
  recipient: isRecipient,
  amount: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  chainId: isNaturalNumberLike,
  timestamp: isNumber,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const leaseValidator = validateByShema(leaseScheme, getError);
