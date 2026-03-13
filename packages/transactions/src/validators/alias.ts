import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isEq,
  isNaturalNumberLike,
  isNumber,
  isPublicKey,
  isValidAliasName,
  orEq,
  validateByShema,
} from './validators';

const aliasScheme = {
  alias: isValidAliasName,
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.ALIAS),
  version: orEq([undefined, 2, 3]),
};

export const aliasValidator = validateByShema(aliasScheme, getError);
