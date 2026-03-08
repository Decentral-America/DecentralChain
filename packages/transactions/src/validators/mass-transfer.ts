import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  gte,
  ifElse,
  isArray,
  isAttachment,
  isDccOrAssetId,
  isEq,
  isNaturalNumberLike,
  isNumber,
  isPublicKey,
  isRecipient,
  isRequired,
  lte,
  orEq,
  pipe,
  prop,
  validateByShema,
  validatePipe,
} from './validators';

const massTransferScheme = {
  type: isEq(TRANSACTION_TYPE.MASS_TRANSFER),
  senderPublicKey: isPublicKey,
  version: orEq([undefined, 1, 2]),
  transfers: validatePipe(
    isArray,
    pipe(prop('length'), gte(1)),
    pipe(prop('length'), lte(100)),
    (data: Array<unknown>) =>
      data.every(
        validatePipe(
          isRequired(true),
          pipe(prop('recipient'), isRecipient),
          pipe(prop('amount'), isNaturalNumberLike),
        ),
      ),
  ),
  assetId: isDccOrAssetId,
  attachment: isAttachment,
  fee: isNaturalNumberLike,
  chainId: isNaturalNumberLike,
  timestamp: isNumber,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const massTransferValidator = validateByShema(massTransferScheme, getError);
