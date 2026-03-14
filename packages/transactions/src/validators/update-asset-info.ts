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
  isValidAssetDescription,
  isValidAssetName,
  orEq,
  validateByShema,
} from './validators';

const updateAssetInfoScheme = {
  assetId: isAssetId,
  chainId: isNaturalNumberLike,
  description: isValidAssetDescription,
  fee: isNaturalNumberLike,
  name: isValidAssetName,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.UPDATE_ASSET_INFO),
  version: orEq([1]),
};

export const updateAssetInfoValidator = validateByShema(updateAssetInfoScheme, getError);
