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
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  leaseId: isAssetId,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.CANCEL_LEASE),
  version: orEq([undefined, 2, 3]),
};

export const cancelLeaseValidator = validateByShema(cancelLeaseScheme, getError);
