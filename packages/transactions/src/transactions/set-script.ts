/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { type SetScriptTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import {
  addProof,
  base64Prefix,
  convertToPairs,
  fee,
  getSenderPublicKey,
  networkByte,
} from '../generic';
import { scriptToProto, txToProtoBytes } from '../proto-serialize';
import {
  type ISetScriptParams,
  type WithId,
  type WithProofs,
  type WithSender,
} from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/* @echo DOCS */
export function setScript(
  params: ISetScriptParams,
  seed: TSeedTypes,
): SetScriptTransaction & WithId & WithProofs;
export function setScript(
  paramsOrTx: (ISetScriptParams & WithSender) | SetScriptTransaction,
  seed?: TSeedTypes,
): SetScriptTransaction & WithId & WithProofs;
export function setScript(
  paramsOrTx: ISetScriptParams & { proofs?: string[] },
  seed?: TSeedTypes,
): SetScriptTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.SET_SCRIPT;
  const version = (paramsOrTx.version ??
    DEFAULT_VERSIONS.SET_SCRIPT) as SetScriptTransaction['version'];
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);
  if (paramsOrTx.script === undefined)
    throw new Error('Script field cannot be undefined. Use null explicitly to remove script');

  const scriptBytes = paramsOrTx.script != null ? scriptToProto(paramsOrTx.script) : null;
  const computedFee =
    scriptBytes != null ? Math.max(100000, Math.ceil(scriptBytes.length / 1024) * 100000) : 500000;

  const tx: SetScriptTransaction & WithId & WithProofs = {
    chainId: networkByte(paramsOrTx.chainId, 76),
    fee: fee(paramsOrTx, computedFee),
    id: '',
    proofs: paramsOrTx.proofs || [],
    script: base64Prefix(paramsOrTx.script),
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.setScript(tx);

  const bytes = version > 1 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
