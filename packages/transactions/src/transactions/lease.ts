/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { type LeaseTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic';
import { txToProtoBytes } from '../proto-serialize';
import { type ILeaseParams, type WithId, type WithProofs, type WithSender } from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/* @echo DOCS */
// @ts-expect-error TS2394: overload incompatible due to version/chainId type widening in intersection
export function lease(
  params: ILeaseParams,
  seed: TSeedTypes,
): LeaseTransaction & WithId & WithProofs;
export function lease(
  paramsOrTx: (ILeaseParams & WithSender) | LeaseTransaction,
  seed?: TSeedTypes,
): LeaseTransaction & WithId & WithProofs;
export function lease(
  paramsOrTx: ILeaseParams & Partial<LeaseTransaction & WithProofs>,
  seed?: TSeedTypes,
): LeaseTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.LEASE;
  const version = paramsOrTx.version ?? DEFAULT_VERSIONS.LEASE;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: LeaseTransaction & WithId & WithProofs = {
    type,
    version,
    senderPublicKey,
    amount: paramsOrTx.amount,
    recipient: paramsOrTx.recipient,
    fee: fee(paramsOrTx, 100000),
    timestamp: paramsOrTx.timestamp || Date.now(),
    proofs: paramsOrTx.proofs || [],
    chainId: networkByte(paramsOrTx.chainId, 76),
    id: '',
  };

  validate.lease(tx as unknown as Record<string, unknown>);

  const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
