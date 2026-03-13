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
// @ts-expect-error TS2394: overload incompatible due to version/chainId type widening in intersection
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

  const tx: BurnTransaction & WithId & WithProofs = {
    amount: paramsOrTx.amount,
    assetId: paramsOrTx.assetId,
    chainId: networkByte(paramsOrTx.chainId, 76),
    fee: fee(paramsOrTx, 100000),
    id: '',
    proofs: paramsOrTx.proofs || [],
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.burn(tx as unknown as Record<string, unknown>);

  const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
