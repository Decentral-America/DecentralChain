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
  paramsOrTx: ISetScriptParams & Partial<SetScriptTransaction & WithProofs>,
  seed?: TSeedTypes,
): SetScriptTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.SET_SCRIPT;
  const version = paramsOrTx.version ?? DEFAULT_VERSIONS.SET_SCRIPT;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);
  if (paramsOrTx.script === undefined)
    throw new Error('Script field cannot be undefined. Use null explicitly to remove script');

  const scriptBytes = scriptToProto(paramsOrTx.script);
  const computedFee =
    scriptBytes != null ? Math.max(100000, Math.ceil(scriptBytes.length / 1024) * 100000) : 500000;

  const tx: SetScriptTransaction & WithId & WithProofs = {
    type,
    version,
    senderPublicKey,
<<<<<<< HEAD
    chainId: networkByte(paramsOrTx.chainId, 87),
<<<<<<< HEAD
<<<<<<< HEAD
    fee: fee(paramsOrTx, 1000000),
=======
    fee: fee(paramsOrTx, 100000000),
>>>>>>> 697d643a (minor fixes)
=======
=======
    chainId: networkByte(paramsOrTx.chainId, 76),
>>>>>>> 71f18869 (feat(DCC-18): migrate from Waves to DecentralChain branding)
    fee: fee(paramsOrTx, computedFee),
>>>>>>> f33083a0 (updated dependencies)
    timestamp: paramsOrTx.timestamp || Date.now(),
    proofs: paramsOrTx.proofs || [],
    id: '',
    script: base64Prefix(paramsOrTx.script),
  };

  validate.setScript(tx);

  const bytes = version > 1 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
