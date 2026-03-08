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
  type: isEq(TRANSACTION_TYPE.ALIAS),
  version: orEq([undefined, 2, 3]),
  senderPublicKey: isPublicKey,
  alias: isValidAliasName,
  fee: isNaturalNumberLike,
  chainId: isNaturalNumberLike,
  timestamp: isNumber,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const aliasValidator = validateByShema(aliasScheme, getError);
