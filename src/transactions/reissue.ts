/**
 * @module index
 */
<<<<<<< HEAD
<<<<<<< HEAD
import {IReissueParams, WithId, WithProofs, WithSender} from '../transactions'
<<<<<<< HEAD
import { signBytes, blake2b, base58Encode } from '@waves/ts-lib-crypto'
<<<<<<< HEAD
<<<<<<< HEAD
=======
import { signBytes, blake2b, base58Encode } from '@decentralchain/ts-lib-crypto'
>>>>>>> 71f18869 (feat(DCC-18): migrate from Waves to DecentralChain branding)
import {addProof, convertToPairs, fee, getSenderPublicKey, networkByte} from '../generic'
=======
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic'
>>>>>>> 697d643a (minor fixes)
=======
import {addProof, convertToPairs, fee, getSenderPublicKey, networkByte} from '../generic'
>>>>>>> f33083a0 (updated dependencies)
=======
import { IReissueParams, WithId, WithProofs, WithSender } from '../transactions'
import { signBytes, blake2b, base58Encode } from '@decentralchain/ts-lib-crypto'
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic'
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
import { TSeedTypes } from '../types'
import { binary } from '@decentralchain/marshall'
import { validate } from '../validators'
import { txToProtoBytes } from '../proto-serialize'
import { DEFAULT_VERSIONS } from '../defaultVersions'
import { ReissueTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types'
=======
import { IReissueParams, WithId, WithProofs, WithSender } from '../transactions';
import { signBytes, blake2b, base58Encode } from '@decentralchain/ts-lib-crypto';
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic';
import { TSeedTypes } from '../types';
import { binary } from '@decentralchain/marshall';
import { validate } from '../validators';
import { txToProtoBytes } from '../proto-serialize';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { ReissueTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup)

/* @echo DOCS */
export function reissue(
  paramsOrTx: IReissueParams,
  seed: TSeedTypes,
): ReissueTransaction & WithId & WithProofs;
export function reissue(
  paramsOrTx: (IReissueParams & WithSender) | ReissueTransaction,
  seed?: TSeedTypes,
): ReissueTransaction & WithId & WithProofs;
export function reissue(
  paramsOrTx: any,
  seed?: TSeedTypes,
): ReissueTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.REISSUE;
  const version = paramsOrTx.version || DEFAULT_VERSIONS.REISSUE;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

<<<<<<< HEAD
<<<<<<< HEAD
  const tx: ReissueTransaction & WithId & WithProofs = {
=======
  const tx: ReissueTransaction & WithId & WithProofs= {
>>>>>>> 697d643a (minor fixes)
=======
  const tx: ReissueTransaction & WithId & WithProofs = {
>>>>>>> f33083a0 (updated dependencies)
    type,
    version,
    senderPublicKey,
    assetId: paramsOrTx.assetId,
    quantity: paramsOrTx.quantity,
    reissuable: paramsOrTx.reissuable,
<<<<<<< HEAD
    chainId: networkByte(paramsOrTx.chainId, 87),
<<<<<<< HEAD
<<<<<<< HEAD
=======
    chainId: networkByte(paramsOrTx.chainId, 76),
<<<<<<< HEAD
>>>>>>> 71f18869 (feat(DCC-18): migrate from Waves to DecentralChain branding)
    fee: fee(paramsOrTx,100000),
=======
    fee: fee(paramsOrTx,100000000000),
>>>>>>> 697d643a (minor fixes)
=======
    fee: fee(paramsOrTx,100000),
>>>>>>> f33083a0 (updated dependencies)
=======
    fee: fee(paramsOrTx, 100000),
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
    timestamp: paramsOrTx.timestamp || Date.now(),
    proofs: paramsOrTx.proofs || [],
    id: '',
  };

  validate.reissue(tx);

  const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => addProof(tx, signBytes(s, bytes), i));
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
