/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { type MassTransferTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
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
  type IMassTransferParams,
  type WithId,
  type WithProofs,
  type WithSender,
} from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/* @echo DOCS */
export function massTransfer(
  params: IMassTransferParams,
  seed: TSeedTypes,
): MassTransferTransaction & WithId & WithProofs;
export function massTransfer(
  paramsOrTx: (IMassTransferParams & WithSender) | MassTransferTransaction,
  seed?: TSeedTypes,
): MassTransferTransaction & WithId & WithProofs;
export function massTransfer(
  paramsOrTx: (IMassTransferParams | MassTransferTransaction) & { proofs?: string[] },
  seed?: TSeedTypes,
): MassTransferTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.MASS_TRANSFER;
  const version = (paramsOrTx.version ??
    DEFAULT_VERSIONS.MASS_TRANSFER) as MassTransferTransaction['version'];
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  if (!Array.isArray(paramsOrTx.transfers) || paramsOrTx.transfers.length === 0)
    throw new Error('Should contain at least one transfer');

  const tx: MassTransferTransaction & WithId & WithProofs = {
    assetId: normalizeAssetId(paramsOrTx.assetId ?? null),
    attachment: paramsOrTx.attachment || '',
    chainId: networkByte(
      paramsOrTx.chainId,
      chainIdFromRecipient(paramsOrTx.transfers[0]?.recipient ?? ''),
    ),
    fee: fee(paramsOrTx, 100000 + Math.ceil(0.5 * paramsOrTx.transfers.length) * 100000),
    id: '',
    proofs: paramsOrTx.proofs || [],
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    transfers: paramsOrTx.transfers,
    type,
    version,
  };
  validate.massTransfer(tx);

  const bytes = version > 1 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
