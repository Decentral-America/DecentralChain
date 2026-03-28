/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { type CancelLeaseTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic';
import { txToProtoBytes } from '../proto-serialize';
import {
  type ICancelLeaseParams,
  type WithId,
  type WithProofs,
  type WithSender,
} from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

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
  paramsOrTx: ICancelLeaseParams & { proofs?: string[] },
  seed?: TSeedTypes,
): CancelLeaseTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.CANCEL_LEASE;
  const version = (paramsOrTx.version ??
    DEFAULT_VERSIONS.CANCEL_LEASE) as CancelLeaseTransaction['version'];
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: CancelLeaseTransaction & WithId & WithProofs = {
    chainId: networkByte(paramsOrTx.chainId, 76),
    fee: fee(paramsOrTx, 100000),
    id: '',
    leaseId: paramsOrTx.leaseId,
    proofs: paramsOrTx.proofs || [],
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.cancelLease(tx);

  const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
