/**
 * @module index
 */
<<<<<<< HEAD
<<<<<<< HEAD
import {
  ISetAssetScriptParams,
  WithId, WithProofs,
  WithSender
} from '../transactions'
<<<<<<< HEAD
import { signBytes, blake2b, base58Encode, } from '@waves/ts-lib-crypto'
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f33083a0 (updated dependencies)
=======
import { signBytes, blake2b, base58Encode, } from '@decentralchain/ts-lib-crypto'
>>>>>>> 71f18869 (feat(DCC-18): migrate from Waves to DecentralChain branding)
=======
import { ISetAssetScriptParams, WithId, WithProofs, WithSender } from '../transactions'
import { signBytes, blake2b, base58Encode } from '@decentralchain/ts-lib-crypto'
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
=======
import { ISetAssetScriptParams, WithId, WithProofs, WithSender } from '../transactions';
import { signBytes, blake2b, base58Encode } from '@decentralchain/ts-lib-crypto';
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup)
import {
  addProof,
  getSenderPublicKey,
  base64Prefix,
  convertToPairs,
  networkByte,
  fee,
<<<<<<< HEAD
} from '../generic'
<<<<<<< HEAD
=======
import { addProof, getSenderPublicKey, base64Prefix, convertToPairs, networkByte, fee } from '../generic'
>>>>>>> 697d643a (minor fixes)
=======
>>>>>>> f33083a0 (updated dependencies)
import { TSeedTypes } from '../types'
import { binary } from '@decentralchain/marshall'
import { validate } from '../validators'
import { txToProtoBytes } from '../proto-serialize'
import { DEFAULT_VERSIONS } from '../defaultVersions'
import { SetAssetScriptTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types'
=======
} from '../generic';
import { TSeedTypes } from '../types';
import { binary } from '@decentralchain/marshall';
import { validate } from '../validators';
import { txToProtoBytes } from '../proto-serialize';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { SetAssetScriptTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup)

/* @echo DOCS */
export function setAssetScript(
  params: ISetAssetScriptParams,
  seed: TSeedTypes,
): SetAssetScriptTransaction & WithId & WithProofs;
export function setAssetScript(
  paramsOrTx: (ISetAssetScriptParams & WithSender) | SetAssetScriptTransaction,
  seed?: TSeedTypes,
): SetAssetScriptTransaction & WithId & WithProofs;
export function setAssetScript(
  paramsOrTx: any,
  seed?: TSeedTypes,
): SetAssetScriptTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.SET_ASSET_SCRIPT;
  const version = paramsOrTx.version || DEFAULT_VERSIONS.SET_ASSET_SCRIPT;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);
  if (paramsOrTx.script == null) throw new Error('Asset script cannot be empty');

<<<<<<< HEAD
<<<<<<< HEAD
  const tx: SetAssetScriptTransaction & WithId & WithProofs = {
=======
  const tx: SetAssetScriptTransaction & WithId & WithProofs= {
>>>>>>> 697d643a (minor fixes)
=======
  const tx: SetAssetScriptTransaction & WithId & WithProofs = {
>>>>>>> f33083a0 (updated dependencies)
    type,
    version,
    senderPublicKey,
    assetId: paramsOrTx.assetId,
    chainId: networkByte(paramsOrTx.chainId, 76),
    fee: fee(paramsOrTx, 100000000),
    timestamp: paramsOrTx.timestamp || Date.now(),
    proofs: paramsOrTx.proofs || [],
    id: '',
    script: base64Prefix(paramsOrTx.script) || '',
  };

  validate.setAssetScript(tx);

  const bytes = version > 1 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => addProof(tx, signBytes(s, bytes), i));
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
