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
<<<<<<< HEAD
    type: isEq(TRANSACTION_TYPE.TRANSFER),
    senderPublicKey: isPublicKey,
    version: orEq([undefined, 2, 3]),
    assetId: isDccOrAssetId,
    feeAssetId: isDccOrAssetId,
    recipient: isRecipient,
    amount: isNaturalNumberOrZeroLike,
    attachment: isAttachment,
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f33083a0 (updated dependencies)
    fee: isNaturalNumberOrZeroLike,
    timestamp: isNaturalNumberOrZeroLike,
    proofs: ifElse(isArray, defaultValue(true), orEq([undefined])),
};
<<<<<<< HEAD
=======
    fee: isNumberLike,
    timestamp: isNumber,
    proofs: ifElse(isArray, defaultValue(true), orEq([ undefined ]))
 };
>>>>>>> 697d643a (minor fixes)
=======
>>>>>>> f33083a0 (updated dependencies)
=======
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
<<<<<<< HEAD
}
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
=======
};
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup)

export const transferValidator = validateByShema(transferScheme, getError);
