import { TRANSACTION_TYPE } from '@decentralchain/types';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isDccOrAssetId,
  isEq,
  isNaturalNumberLike,
  isPublicKey,
  isString,
  orEq,
  validateByShema,
} from './validators';

const invokeExpressionScheme = {
  chainId: isNaturalNumberLike,
  expression: isString,
  fee: isNaturalNumberLike,
  feeAssetId: isDccOrAssetId,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  senderPublicKey: isPublicKey,
  timestamp: isNaturalNumberLike,
  type: isEq(TRANSACTION_TYPE.INVOKE_EXPRESSION),
  version: orEq([undefined, 1]),
};

export const invokeExpressionValidator = validateByShema(invokeExpressionScheme, getError);
