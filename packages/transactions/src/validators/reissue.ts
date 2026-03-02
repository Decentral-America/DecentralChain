import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isAssetId,
  isBoolean,
  isEq,
  isNaturalNumberLike,
  isNumber,
  isPublicKey,
  orEq,
  validateByShema,
} from './validators';

const reissueScheme = {
  type: isEq(TRANSACTION_TYPE.REISSUE),
  senderPublicKey: isPublicKey,
  version: orEq([undefined, 2, 3]),
  assetId: isAssetId,
  quantity: isNaturalNumberLike,
  reissuable: isBoolean,
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  timestamp: isNumber,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const reissueValidator = validateByShema(reissueScheme, getError);
