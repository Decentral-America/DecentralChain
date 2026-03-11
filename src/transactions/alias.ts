/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { type AliasTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic';
import { txToProtoBytes } from '../proto-serialize';
import { type IAliasParams, type WithId, type WithProofs, type WithSender } from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/* @echo DOCS */
// @ts-expect-error TS2394: overload incompatible due to version/chainId type widening in intersection
export function alias(
  params: IAliasParams,
  seed: TSeedTypes,
): AliasTransaction & WithId & WithProofs;
export function alias(
  paramsOrTx: (IAliasParams & WithSender) | AliasTransaction,
  seed?: TSeedTypes,
): AliasTransaction & WithId & WithProofs;
export function alias(
  paramsOrTx: IAliasParams & Partial<AliasTransaction & WithProofs>,
  seed?: TSeedTypes,
): AliasTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.ALIAS;
  const version = paramsOrTx.version ?? DEFAULT_VERSIONS.ALIAS;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: AliasTransaction & WithId & WithProofs = {
    type,
    version,
    senderPublicKey,
    alias: paramsOrTx.alias,
    fee: fee(paramsOrTx, 100000),
    timestamp: paramsOrTx.timestamp || Date.now(),
    chainId: networkByte(paramsOrTx.chainId, 76),
    proofs: paramsOrTx.proofs || [],
    id: '',
  };

  validate.alias(tx as unknown as Record<string, unknown>);

  const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx);
  const idBytes = version > 2 ? bytes : [bytes[0], ...bytes.slice(36, -16)];

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });

  tx.id = base58Encode(blake2b(Uint8Array.from(idBytes)));

  return tx;
}
