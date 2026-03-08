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
  type: isEq(TRANSACTION_TYPE.DATA),
  senderPublicKey: isPublicKey,
  version: orEq([undefined, 1, 2]),
  data: (data: Array<unknown>) =>
    isArray(data) && data.every((item) => isValidData(item) || isValidDeleteRequest(item)),
  fee: isNaturalNumberLike,
  chainId: isNaturalNumberLike,
  timestamp: isNumber,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const dataFieldValidator = (item: unknown) =>
  isValidData(item) || isValidDeleteRequest(item);

export const dataValidator = validateByShema(dataScheme, getError);
