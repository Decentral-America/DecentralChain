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
  isNaturalNumberOrZeroLike,
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
  type: isEq(TRANSACTION_TYPE.ISSUE),
  version: orEq([undefined, 2, 3]),
  senderPublicKey: isPublicKey,
  name: isValidAssetName,
  description: isValidAssetDescription,
  quantity: isNaturalNumberLike,
  decimals: validatePipe(isNumber, gte(0), lte(8)),
  reissuable: isBoolean,
  script: ifElse(isRequired(true), isBase64, defaultValue(true)),
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberOrZeroLike,
  timestamp: isNumber,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const issueValidator = validateByShema(issueScheme, getError);
