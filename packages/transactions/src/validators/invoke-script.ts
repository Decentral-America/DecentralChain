import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import {
  defaultValue,
  getError,
  gte,
  ifElse,
  isArray,
  isEq,
  isNaturalNumberLike,
  isNaturalNumberOrZeroLike,
  isPublicKey,
  isRecipient,
  isRequired,
  isString,
  isValidDataPair,
  isDccOrAssetId,
  orEq,
  pipe,
  prop,
  validateByShema,
  validatePipe,
} from './validators';

const invokeScheme = {
  type: isEq(TRANSACTION_TYPE.INVOKE_SCRIPT),
  senderPublicKey: isPublicKey,
  version: orEq([undefined, 1, 2]),
  dApp: isRecipient,

  call: ifElse(
    orEq([null, undefined]),
    defaultValue(true),
    validatePipe(
      pipe(prop('function'), isString),
      pipe(prop('function'), prop('length'), gte(0)),
      pipe(prop('args'), isArray),
      pipe(prop('args'), (args: Array<unknown>) =>
        args.every(validatePipe(isRequired(true), isValidDataPair)),
      ),
    ),
  ),
<<<<<<< HEAD
  payment: validatePipe(
      isArray,
      (data: Array<unknown>) => data.every(
          validatePipe(
              pipe(prop('amount'), isNumberLike),
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
              pipe(prop('assetId'), isWavesOrAssetId)
=======
              pipe(prop('assetId'), isAssetId),
>>>>>>> 697d643a (minor fixes)
=======
              pipe(prop('assetId'), isWavesOrAssetId)
>>>>>>> f33083a0 (updated dependencies)
=======
              pipe(prop('assetId'), isDccOrAssetId)
>>>>>>> 71f18869 (feat(DCC-18): migrate from Waves to DecentralChain branding)
          )
      )
=======
  payment: validatePipe(isArray, (data: Array<unknown>) =>
    data.every(
      validatePipe(
        pipe(prop('amount'), isNaturalNumberOrZeroLike),
        pipe(prop('assetId'), isDccOrAssetId),
      ),
    ),
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
  ),
  fee: isNaturalNumberOrZeroLike,
  feeAssetId: isDccOrAssetId,
  chainId: isNaturalNumberLike,
  timestamp: isNaturalNumberLike,
  proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};

export const invokeValidator = validateByShema(invokeScheme, getError);
