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
  isValidData,
  isValidDeleteRequest,
  orEq,
  validateByShema,
} from './validators';

const dataScheme = {
  chainId: isNaturalNumberLike,
  data: (data: Array<unknown>) =>
    isArray(data) && data.every((item) => isValidData(item) || isValidDeleteRequest(item)),
  fee: isNaturalNumberLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.DATA),
  version: orEq([undefined, 1, 2]),
};

export const dataFieldValidator = (item: unknown) =>
  isValidData(item) || isValidDeleteRequest(item);

export const dataValidator = validateByShema(dataScheme, getError);
