import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isAttachment,
  isDccOrAssetId,
  isEq,
  isNaturalNumberLike,
  isNaturalNumberOrZeroLike,
  isPublicKey,
  isRecipient,
  orEq,
  validateByShema,
} from './validators';

const transferScheme = {
  amount: isNaturalNumberLike,
  assetId: isDccOrAssetId,
  attachment: isAttachment,
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  feeAssetId: isDccOrAssetId,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  recipient: isRecipient,
  senderPublicKey: isPublicKey,
  timestamp: isNaturalNumberOrZeroLike,
  type: isEq(TRANSACTION_TYPE.TRANSFER),
  version: orEq([undefined, 2, 3]),
};

export const transferValidator = validateByShema(transferScheme, getError);
