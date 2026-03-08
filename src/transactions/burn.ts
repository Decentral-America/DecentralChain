/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { type BurnTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic';
import { txToProtoBytes } from '../proto-serialize';
import { type IBurnParams, type WithId, type WithProofs, type WithSender } from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/* @echo DOCS */
export function burn(params: IBurnParams, seed: TSeedTypes): BurnTransaction & WithId & WithProofs;
export function burn(
  paramsOrTx: (IBurnParams & WithSender) | BurnTransaction,
  seed?: TSeedTypes,
): BurnTransaction & WithId & WithProofs;
export function burn(
  paramsOrTx: IBurnParams & Partial<BurnTransaction & WithProofs>,
  seed?: TSeedTypes,
): BurnTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.BURN;
  const version = paramsOrTx.version ?? DEFAULT_VERSIONS.BURN;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

<<<<<<< HEAD
<<<<<<< HEAD
  const tx: BurnTransaction & WithId & WithProofs = {
=======
  const tx: BurnTransaction & WithId & WithProofs= {
>>>>>>> 697d643a (minor fixes)
=======
  const tx: BurnTransaction & WithId & WithProofs = {
>>>>>>> f33083a0 (updated dependencies)
    type,
    version,
    senderPublicKey,
    assetId: paramsOrTx.assetId,
    amount: paramsOrTx.amount,
<<<<<<< HEAD
    chainId: networkByte(paramsOrTx.chainId, 87),
<<<<<<< HEAD
<<<<<<< HEAD
=======
    chainId: networkByte(paramsOrTx.chainId, 76),
>>>>>>> 71f18869 (feat(DCC-18): migrate from Waves to DecentralChain branding)
    fee: fee(paramsOrTx, 100000),
=======
    fee: fee(paramsOrTx, 2000000),
>>>>>>> 697d643a (minor fixes)
=======
    fee: fee(paramsOrTx, 100000),
>>>>>>> f33083a0 (updated dependencies)
    timestamp: paramsOrTx.timestamp || Date.now(),
    proofs: paramsOrTx.proofs || [],
    id: '',
  };

  validate.burn(tx);

  const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
