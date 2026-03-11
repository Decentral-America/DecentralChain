/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { type SponsorshipTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic';
import { txToProtoBytes } from '../proto-serialize';
import {
  type ISponsorshipParams,
  type WithId,
  type WithProofs,
  type WithSender,
} from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/* @echo DOCS */
// @ts-expect-error TS2394: overload incompatible due to version/chainId type widening in intersection
export function sponsorship(
  params: ISponsorshipParams,
  seed: TSeedTypes,
): SponsorshipTransaction & WithId & WithProofs;
export function sponsorship(
  paramsOrTx: (ISponsorshipParams & WithSender) | SponsorshipTransaction,
  seed?: TSeedTypes,
): SponsorshipTransaction & WithId & WithProofs;
export function sponsorship(
  paramsOrTx: ISponsorshipParams & Partial<SponsorshipTransaction & WithProofs>,
  seed?: TSeedTypes,
): SponsorshipTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.SPONSORSHIP;
  const version = paramsOrTx.version ?? DEFAULT_VERSIONS.SPONSORSHIP;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: SponsorshipTransaction & WithId & WithProofs = {
    type,
    version,
    senderPublicKey,
    minSponsoredAssetFee: paramsOrTx.minSponsoredAssetFee,
    assetId: paramsOrTx.assetId,
    fee: fee(paramsOrTx, 1e5),
    timestamp: paramsOrTx.timestamp || Date.now(),
    chainId: networkByte(paramsOrTx.chainId, 76),
    proofs: paramsOrTx.proofs || [],
    id: '',
  };

  validate.sponsorship(tx as unknown as Record<string, unknown>);

  const bytes = version > 1 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
