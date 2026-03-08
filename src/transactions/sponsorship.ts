/**
 * @module index
 */
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import {ISponsorshipParams, WithId, WithProofs, WithSender} from '../transactions'
<<<<<<< HEAD
import { signBytes, blake2b, base58Encode } from '@waves/ts-lib-crypto'
<<<<<<< HEAD
<<<<<<< HEAD
=======
import { signBytes, blake2b, base58Encode } from '@decentralchain/ts-lib-crypto'
>>>>>>> 71f18869 (feat(DCC-18): migrate from Waves to DecentralChain branding)
import {addProof, getSenderPublicKey, convertToPairs, fee, networkByte} from '../generic'
=======
import { addProof, getSenderPublicKey, convertToPairs, fee, networkByte } from '../generic'
>>>>>>> 697d643a (minor fixes)
=======
import {addProof, getSenderPublicKey, convertToPairs, fee, networkByte} from '../generic'
>>>>>>> f33083a0 (updated dependencies)
=======
import { ISponsorshipParams, WithId, WithProofs, WithSender } from '../transactions'
import { signBytes, blake2b, base58Encode } from '@decentralchain/ts-lib-crypto'
import { addProof, getSenderPublicKey, convertToPairs, fee, networkByte } from '../generic'
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
import { TSeedTypes } from '../types'
import { binary } from '@decentralchain/marshall'
import { validate } from '../validators'
import { txToProtoBytes } from '../proto-serialize'
import { DEFAULT_VERSIONS } from '../defaultVersions'
import { SponsorshipTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types'
=======
import { ISponsorshipParams, WithId, WithProofs, WithSender } from '../transactions';
import { signBytes, blake2b, base58Encode } from '@decentralchain/ts-lib-crypto';
import { addProof, getSenderPublicKey, convertToPairs, fee, networkByte } from '../generic';
import { TSeedTypes } from '../types';
=======

>>>>>>> e3d703a4 (chore: migrate from ESLint/Prettier/Husky to Biome/Lefthook)
import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { type SponsorshipTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
<<<<<<< HEAD
import { SponsorshipTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup)
=======
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
>>>>>>> e3d703a4 (chore: migrate from ESLint/Prettier/Husky to Biome/Lefthook)

/* @echo DOCS */
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

<<<<<<< HEAD
<<<<<<< HEAD
  const tx: SponsorshipTransaction & WithId & WithProofs = {
=======
  const tx: SponsorshipTransaction & WithId & WithProofs= {
>>>>>>> 697d643a (minor fixes)
=======
  const tx: SponsorshipTransaction & WithId & WithProofs = {
>>>>>>> f33083a0 (updated dependencies)
    type,
    version,
    senderPublicKey,
    minSponsoredAssetFee: paramsOrTx.minSponsoredAssetFee,
    assetId: paramsOrTx.assetId,
<<<<<<< HEAD
<<<<<<< HEAD
    fee: fee(paramsOrTx, 1e5),
=======
    fee: fee(paramsOrTx, 1000000000),
>>>>>>> 697d643a (minor fixes)
=======
    fee: fee(paramsOrTx, 1e5),
>>>>>>> f33083a0 (updated dependencies)
    timestamp: paramsOrTx.timestamp || Date.now(),
    chainId: networkByte(paramsOrTx.chainId, 76),
    proofs: paramsOrTx.proofs || [],
    id: '',
  };

  validate.sponsorship(tx);

  const bytes = version > 1 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
