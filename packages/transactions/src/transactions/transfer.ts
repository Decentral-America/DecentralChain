/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { TRANSACTION_TYPE, type TransferTransaction } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import {
  addProof,
  chainIdFromRecipient,
  convertToPairs,
  fee,
  getSenderPublicKey,
  networkByte,
  normalizeAssetId,
} from '../generic';
import { txToProtoBytes } from '../proto-serialize';
import {
  type ITransferParams,
  type WithId,
  type WithProofs,
  type WithSender,
} from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/* @echo DOCS */
export function transfer(
  params: ITransferParams,
  seed: TSeedTypes,
): TransferTransaction & WithId & WithProofs;
export function transfer(
  paramsOrTx: (ITransferParams & WithSender) | TransferTransaction,
  seed?: TSeedTypes,
): TransferTransaction & WithId & WithProofs;
export function transfer(
  paramsOrTx: (ITransferParams | TransferTransaction) & { proofs?: string[] },
  seed?: TSeedTypes,
): TransferTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.TRANSFER;
  const version = (paramsOrTx.version ??
    DEFAULT_VERSIONS.TRANSFER) as TransferTransaction['version'];
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: TransferTransaction & WithId & WithProofs = {
    amount: paramsOrTx.amount,
    assetId: normalizeAssetId(paramsOrTx.assetId ?? null),
    attachment: paramsOrTx.attachment || '',
    chainId: networkByte(paramsOrTx.chainId, chainIdFromRecipient(paramsOrTx.recipient)),
    fee: fee(paramsOrTx, 100000),
    feeAssetId: normalizeAssetId(paramsOrTx.feeAssetId ?? null),
    id: '',
    proofs: paramsOrTx.proofs || [],
    recipient: paramsOrTx.recipient,
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.transfer(tx);

  const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
