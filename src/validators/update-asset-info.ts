import { TRANSACTION_TYPE } from '@decentralchain/ts-types'
import {
<<<<<<< HEAD
<<<<<<< HEAD
  defaultValue,
=======
  isEq,
  orEq,
  isAssetId,
  isRecipient,
  isNumber,
  isNumberLike,
  isArray,
>>>>>>> 697d643a (minor fixes)
=======
  defaultValue,
>>>>>>> f33083a0 (updated dependencies)
  getError,
  ifElse,
  isArray,
  isAssetId,
  isEq,
  isNaturalNumberOrZeroLike,
  isNumber,
  isPublicKey,
  isValidAssetDescription,
  isValidAssetName,
  orEq,
  validateByShema,
} from './validators'

const updateAssetInfoScheme = {
  type: isEq(TRANSACTION_TYPE.UPDATE_ASSET_INFO),
  senderPublicKey: isPublicKey,
  name: isValidAssetName,
  description: isValidAssetDescription,
  version: orEq([1]),
  assetId: isAssetId,
  fee: isNaturalNumberOrZeroLike,
  timestamp: isNumber,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
}

export const updateAssetInfoValidator = validateByShema(updateAssetInfoScheme, getError)
