import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { orderValidator } from './order';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isEq,
  isNaturalNumberLike,
  isNaturalNumberOrZeroLike,
  isNumber,
  isPublicKey,
  isRequired,
  orEq,
  validateByShema,
  validatePipe,
} from './validators';

const exchangeScheme = {
  amount: isNaturalNumberLike,
  buyMatcherFee: isNaturalNumberOrZeroLike,
  fee: isNaturalNumberLike,
  order1: validatePipe(isRequired(true), orderValidator),
  order2: validatePipe(isRequired(true), orderValidator),
  price: isNaturalNumberLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  sellMatcherFee: isNaturalNumberOrZeroLike,
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.EXCHANGE),
  version: orEq([undefined, 1, 2, 3]),
};

export const exchangeValidator = validateByShema(exchangeScheme, getError);
