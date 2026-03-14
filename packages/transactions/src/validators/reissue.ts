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
  assetId: isAssetId,
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  quantity: isNaturalNumberLike,
  reissuable: isBoolean,
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.REISSUE),
  version: orEq([undefined, 2, 3]),
};

export const reissueValidator = validateByShema(reissueScheme, getError);
