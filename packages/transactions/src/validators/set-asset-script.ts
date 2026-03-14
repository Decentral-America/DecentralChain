import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isAssetId,
  isBase64,
  isEq,
  isNaturalNumberLike,
  isNumber,
  isPublicKey,
  orEq,
  validateByShema,
} from './validators';

const setAssetScriptScheme = {
  assetId: isAssetId,
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  script: isBase64,
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.SET_ASSET_SCRIPT),
  version: orEq([undefined, 1, 2]),
};

export const setAssetScriptValidator = validateByShema(setAssetScriptScheme, getError);
