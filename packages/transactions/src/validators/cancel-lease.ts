import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isAssetId,
  isEq,
  isNaturalNumberLike,
  isNumber,
  isPublicKey,
  orEq,
  validateByShema,
} from './validators';

const cancelLeaseScheme = {
  type: isEq(TRANSACTION_TYPE.CANCEL_LEASE),
  senderPublicKey: isPublicKey,
  version: orEq([undefined, 2, 3]),
  leaseId: isAssetId,
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  timestamp: isNumber,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const cancelLeaseValidator = validateByShema(cancelLeaseScheme, getError);
