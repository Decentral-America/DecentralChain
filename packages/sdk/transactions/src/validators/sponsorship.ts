import { TRANSACTION_TYPE } from '@decentralchain/types';
import {
  defaultValue,
  getError,
  ifElse,
  isArray,
  isAssetId,
  isEq,
  isNaturalNumberLike,
  isNaturalNumberOrZeroLike,
  isNumber,
  isPublicKey,
  orEq,
  validateByShema,
} from './validators';

const sponsorshipScheme = {
  assetId: isAssetId,
  chainId: isNaturalNumberLike,
  fee: isNaturalNumberLike,
  minSponsoredAssetFee: isNaturalNumberOrZeroLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
  senderPublicKey: isPublicKey,
  timestamp: isNumber,
  type: isEq(TRANSACTION_TYPE.SPONSORSHIP),
  version: orEq([undefined, 1, 2]),
};

export const sponsorshipValidator = validateByShema(sponsorshipScheme, getError);
