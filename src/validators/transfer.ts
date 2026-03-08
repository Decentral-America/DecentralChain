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
  type: isEq(TRANSACTION_TYPE.TRANSFER),
  senderPublicKey: isPublicKey,
  version: orEq([undefined, 2, 3]),
  assetId: isDccOrAssetId,
  feeAssetId: isDccOrAssetId,
  recipient: isRecipient,
  amount: isNaturalNumberLike,
  attachment: isAttachment,
  fee: isNaturalNumberLike,
  chainId: isNaturalNumberLike,
  timestamp: isNaturalNumberOrZeroLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const transferValidator = validateByShema(transferScheme, getError);
