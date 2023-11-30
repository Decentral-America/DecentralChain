import {
    isEq,
    orEq,
    isWavesOrAssetId,
    isRecipient,
    isNumber,
    isNumberLike,
    isAttachment,
    isArray,
    getError,
    validateByShema,
    ifElse, defaultValue, isPublicKey, isNaturalNumberOrZeroLike
} from './validators'
import {TRANSACTION_TYPE} from '@waves/ts-types'


const transferScheme = {
    type: isEq(TRANSACTION_TYPE.TRANSFER),
    senderPublicKey: isPublicKey,
    version: orEq([undefined, 2, 3]),
    assetId: isWavesOrAssetId,
    feeAssetId: isWavesOrAssetId,
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


export const transferValidator = validateByShema(transferScheme, getError);
