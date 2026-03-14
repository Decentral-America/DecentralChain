import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isBase64,
  isEq,
  isNaturalNumberLike,
  isNumber,
  isPublicKey,
  orEq,
  validateByShema,
} from './validators';

const setScriptScheme = {
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  script: ifElse(isEq(null), defaultValue(true), isBase64),
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.SET_SCRIPT),
  version: orEq([undefined, 1, 2]),
};

export const setScriptValidator = validateByShema(setScriptScheme, getError);
