/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import {
  type InvokeScriptPayment,
  type InvokeScriptTransaction,
  TRANSACTION_TYPE,
} from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import {
  addProof,
  convertToPairs,
  fee,
  getSenderPublicKey,
  networkByte,
  normalizeAssetId,
} from '../generic';
import { txToProtoBytes } from '../proto-serialize';
import {
  type IInvokeScriptParams,
  type WithId,
  type WithProofs,
  type WithSender,
} from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/* @echo DOCS */
// @ts-expect-error TS2394: overload incompatible due to version/chainId type widening in intersection
export function invokeScript(
  params: IInvokeScriptParams,
  seed: TSeedTypes,
): InvokeScriptTransaction & WithId & WithProofs;
export function invokeScript(
  paramsOrTx: (IInvokeScriptParams & WithSender) | InvokeScriptTransaction,
  seed?: TSeedTypes,
): InvokeScriptTransaction & WithId & WithProofs;
export function invokeScript(
  paramsOrTx: IInvokeScriptParams & Partial<InvokeScriptTransaction & WithProofs>,
  seed?: TSeedTypes,
): InvokeScriptTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.INVOKE_SCRIPT;
  const version = paramsOrTx.version ?? DEFAULT_VERSIONS.INVOKE_SCRIPT;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: InvokeScriptTransaction & WithId & WithProofs = {
    call: callField(paramsOrTx) as InvokeScriptTransaction['call'],
    chainId: networkByte(paramsOrTx.chainId, 76),
    dApp: paramsOrTx.dApp,
    fee: fee(paramsOrTx, 500000),
    feeAssetId: normalizeAssetId(paramsOrTx.feeAssetId ?? null),
    id: '',
    payment: mapPayment(paramsOrTx.payment),
    proofs: paramsOrTx.proofs || [],
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.invokeScript(tx as unknown as Record<string, unknown>);

  const bytes = version > 1 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}

const mapPayment = (payments?: InvokeScriptPayment[]): InvokeScriptPayment[] =>
  payments == null
    ? []
    : payments.map((pmt) => ({ ...pmt, assetId: pmt.assetId === 'DCC' ? null : pmt.assetId }));

const callField = (paramsOrTx: { call?: { function: string; args?: unknown[] } | null }) => {
  return paramsOrTx.call ? { ...paramsOrTx.call, args: paramsOrTx.call.args || [] } : null;
};
