import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  gte,
  ifElse,
  isArray,
  isBase64,
  isBoolean,
  isEq,
  isNaturalNumberLike,
  isNumber,
  isPublicKey,
  isRequired,
  isValidAssetDescription,
  isValidAssetName,
  lte,
  orEq,
  validateByShema,
  validatePipe,
} from './validators';

const issueScheme = {
  chainId: isNaturalNumberLike,
  decimals: validatePipe(isNumber, gte(0), lte(8)),
  description: isValidAssetDescription,
  fee: isNaturalNumberLike,
  name: isValidAssetName,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  quantity: isNaturalNumberLike,
  reissuable: isBoolean,
  script: ifElse(isRequired(true), isBase64, defaultValue(true)),
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.ISSUE),
  version: orEq([undefined, 2, 3]),
};

export const issueValidator = validateByShema(issueScheme, getError);
