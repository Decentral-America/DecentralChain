/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { type SetAssetScriptTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import {
  addProof,
  base64Prefix,
  convertToPairs,
  fee,
  getSenderPublicKey,
  networkByte,
} from '../generic';
import { txToProtoBytes } from '../proto-serialize';
import {
  type ISetAssetScriptParams,
  type WithId,
  type WithProofs,
  type WithSender,
} from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

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
  paramsOrTx: ISetAssetScriptParams & { proofs?: string[] },
  seed?: TSeedTypes,
): SetAssetScriptTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.SET_ASSET_SCRIPT;
  const version = (paramsOrTx.version ??
    DEFAULT_VERSIONS.SET_ASSET_SCRIPT) as SetAssetScriptTransaction['version'];
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);
  if (paramsOrTx.script == null) throw new Error('Asset script cannot be empty');

  const tx: SetAssetScriptTransaction & WithId & WithProofs = {
    assetId: paramsOrTx.assetId,
    chainId: networkByte(paramsOrTx.chainId, 76),
    fee: fee(paramsOrTx, 100000000),
    id: '',
    proofs: paramsOrTx.proofs || [],
    script: base64Prefix(paramsOrTx.script) ?? '',
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.setAssetScript(tx);

  const bytes = version > 1 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
