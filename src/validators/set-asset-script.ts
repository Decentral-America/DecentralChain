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
  type: isEq(TRANSACTION_TYPE.SET_ASSET_SCRIPT),
  senderPublicKey: isPublicKey,
  version: orEq([undefined, 1, 2]),
  assetId: isAssetId,
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  timestamp: isNumber,
  script: isBase64,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const setAssetScriptValidator = validateByShema(setAssetScriptScheme, getError);
