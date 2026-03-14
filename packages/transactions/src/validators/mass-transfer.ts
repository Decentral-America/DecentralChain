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
  assetId: isDccOrAssetId,
  attachment: isAttachment,
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
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
  type: isEq(TRANSACTION_TYPE.MASS_TRANSFER),
  version: orEq([undefined, 1, 2]),
};

export const massTransferValidator = validateByShema(massTransferScheme, getError);
