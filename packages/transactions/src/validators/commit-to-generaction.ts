import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isBase58,
  isEq,
  isNaturalNumberOrZeroLike,
  isNumber,
  isPublicKey,
  orEq,
  validateByShema,
} from './validators';

const commitToGeneractionScheme = {
  commitmentSignature: isBase58,
  endorserPublicKey: isBase58,
  fee: isNaturalNumberOrZeroLike,
  generationPeriodStart: isNumber,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.COMMIT_TO_GENERATION),
  version: orEq([1]),
};

export const commitToGeneractionValidator = validateByShema(commitToGeneractionScheme, getError);
