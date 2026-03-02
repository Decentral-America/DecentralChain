import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isAssetId,
  isEq,
  isNaturalNumberLike,
  isNaturalNumberOrNullLike,
  isNumber,
  isPublicKey,
  orEq,
  validateByShema,
} from './validators';

const sponsorshipScheme = {
  type: isEq(TRANSACTION_TYPE.SPONSORSHIP),
  senderPublicKey: isPublicKey,
  version: orEq([undefined, 1, 2]),
  assetId: isAssetId,
  minSponsoredAssetFee: isNaturalNumberOrNullLike,
  fee: isNaturalNumberLike,
  chainId: isNaturalNumberLike,
  timestamp: isNumber,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const sponsorshipValidator = validateByShema(sponsorshipScheme, getError);
