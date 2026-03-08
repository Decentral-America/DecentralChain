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
  type: isEq(TRANSACTION_TYPE.EXCHANGE),
  senderPublicKey: isPublicKey,
  version: orEq([undefined, 1, 2, 3]),
  order1: validatePipe(isRequired(true), orderValidator),
  order2: validatePipe(isRequired(true), orderValidator),
  amount: isNaturalNumberLike,
  price: isNaturalNumberLike,
  buyMatcherFee: isNaturalNumberOrZeroLike,
  sellMatcherFee: isNaturalNumberOrZeroLike,
  fee: isNaturalNumberLike,
  timestamp: isNumber,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const exchangeValidator = validateByShema(exchangeScheme, getError);
