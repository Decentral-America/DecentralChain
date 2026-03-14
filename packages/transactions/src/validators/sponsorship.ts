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
  assetId: isAssetId,
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  minSponsoredAssetFee: isNaturalNumberOrNullLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.SPONSORSHIP),
  version: orEq([undefined, 1, 2]),
};

export const sponsorshipValidator = validateByShema(sponsorshipScheme, getError);
