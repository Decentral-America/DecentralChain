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
export function lease(
  params: ILeaseParams,
  seed: TSeedTypes,
): LeaseTransaction & WithId & WithProofs;
export function lease(
  paramsOrTx: (ILeaseParams & WithSender) | LeaseTransaction,
  seed?: TSeedTypes,
): LeaseTransaction & WithId & WithProofs;
export function lease(
  paramsOrTx: ILeaseParams & { proofs?: string[] },
  seed?: TSeedTypes,
): LeaseTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.LEASE;
  const version = (paramsOrTx.version ?? DEFAULT_VERSIONS.LEASE) as LeaseTransaction['version'];
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: LeaseTransaction & WithId & WithProofs = {
    amount: paramsOrTx.amount,
    chainId: networkByte(paramsOrTx.chainId, 76),
    fee: fee(paramsOrTx, 100000),
    id: '',
    proofs: paramsOrTx.proofs || [],
    recipient: paramsOrTx.recipient,
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.lease(tx);

  const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
