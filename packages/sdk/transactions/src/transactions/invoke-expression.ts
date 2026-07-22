/**
 * @module index
 */

import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { type InvokeExpressionTransaction, TRANSACTION_TYPE } from '@decentralchain/types';
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
  type IInvokeExpressionParams,
  type WithId,
  type WithProofs,
  type WithSender,
} from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/* @echo DOCS */
export function invokeExpression(
  params: IInvokeExpressionParams,
  seed: TSeedTypes,
): InvokeExpressionTransaction & WithId & WithProofs;
export function invokeExpression(
  paramsOrTx: (IInvokeExpressionParams & WithSender) | InvokeExpressionTransaction,
  seed?: TSeedTypes,
): InvokeExpressionTransaction & WithId & WithProofs;
export function invokeExpression(
  paramsOrTx: (IInvokeExpressionParams | InvokeExpressionTransaction) & { proofs?: string[] },
  seed?: TSeedTypes,
): InvokeExpressionTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.INVOKE_EXPRESSION;
  const version = (paramsOrTx.version ??
    DEFAULT_VERSIONS.INVOKE_EXPRESSION) as InvokeExpressionTransaction['version'];
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: InvokeExpressionTransaction & WithId & WithProofs = {
    chainId: networkByte(paramsOrTx.chainId, 63),
    expression: paramsOrTx.expression,
    fee: fee(paramsOrTx, 500000),
    feeAssetId: normalizeAssetId(paramsOrTx.feeAssetId ?? null),
    id: '',
    proofs: paramsOrTx.proofs || [],
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.invokeExpression(tx);

  const bytes = txToProtoBytes(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
