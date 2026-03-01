/**
 * @module index
 */
<<<<<<< HEAD
import { ICancelLeaseParams, WithId, WithProofs, WithSender } from '../transactions'
import { binary } from '@decentralchain/marshall'
<<<<<<< HEAD
import { signBytes, blake2b, base58Encode } from '@waves/ts-lib-crypto'
<<<<<<< HEAD
<<<<<<< HEAD
=======
import { signBytes, blake2b, base58Encode } from '@decentralchain/ts-lib-crypto'
<<<<<<< HEAD
>>>>>>> 71f18869 (feat(DCC-18): migrate from Waves to DecentralChain branding)
import {addProof, getSenderPublicKey, convertToPairs, networkByte, fee} from '../generic'
=======
import { addProof, getSenderPublicKey, convertToPairs, networkByte, fee } from '../generic'
>>>>>>> 697d643a (minor fixes)
=======
import {addProof, getSenderPublicKey, convertToPairs, networkByte, fee} from '../generic'
>>>>>>> f33083a0 (updated dependencies)
=======
import { addProof, getSenderPublicKey, convertToPairs, networkByte, fee } from '../generic'
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
import { TSeedTypes } from '../types'
import { validate } from '../validators'
import { txToProtoBytes } from '../proto-serialize'
import { DEFAULT_VERSIONS } from '../defaultVersions'
import { CancelLeaseTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types'
=======
import { ICancelLeaseParams, WithId, WithProofs, WithSender } from '../transactions';
import { binary } from '@decentralchain/marshall';
import { signBytes, blake2b, base58Encode } from '@decentralchain/ts-lib-crypto';
import { addProof, getSenderPublicKey, convertToPairs, networkByte, fee } from '../generic';
import { TSeedTypes } from '../types';
import { validate } from '../validators';
import { txToProtoBytes } from '../proto-serialize';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { CancelLeaseTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup)

/* @echo DOCS */
export function cancelLease(
  params: ICancelLeaseParams,
  seed: TSeedTypes,
): CancelLeaseTransaction & WithId & WithProofs;
export function cancelLease(
  paramsOrTx: (ICancelLeaseParams & WithSender) | CancelLeaseTransaction,
  seed?: TSeedTypes,
): CancelLeaseTransaction & WithId & WithProofs;
export function cancelLease(
  paramsOrTx: any,
  seed?: TSeedTypes,
): CancelLeaseTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.CANCEL_LEASE;
  const version = paramsOrTx.version || DEFAULT_VERSIONS.CANCEL_LEASE;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: CancelLeaseTransaction & WithId & WithProofs = {
    type,
    version,
    senderPublicKey,
    leaseId: paramsOrTx.leaseId,
    fee: fee(paramsOrTx, 100000),
    timestamp: paramsOrTx.timestamp || Date.now(),
    chainId: networkByte(paramsOrTx.chainId, 76),
    proofs: paramsOrTx.proofs || [],
    id: '',
  };

  validate.cancelLease(tx);

  const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => addProof(tx, signBytes(s, bytes), i));
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
