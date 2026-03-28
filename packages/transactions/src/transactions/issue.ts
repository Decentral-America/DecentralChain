/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import {
  type AssetDecimals,
  type IssueTransaction,
  TRANSACTION_TYPE,
} from '@decentralchain/ts-types';
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
import { type IIssueParams, type WithId, type WithProofs, type WithSender } from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/* @echo DOCS */
export function issue(
  params: IIssueParams,
  seed: TSeedTypes,
): IssueTransaction & WithId & WithProofs;
export function issue(
  paramsOrTx: (IIssueParams & WithSender) | IssueTransaction,
  seed?: TSeedTypes,
): IssueTransaction & WithId & WithProofs;
export function issue(
  paramsOrTx: (IIssueParams | IssueTransaction) & { proofs?: string[] },
  seed?: TSeedTypes,
): IssueTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.ISSUE;
  const version = (paramsOrTx.version ?? DEFAULT_VERSIONS.ISSUE) as IssueTransaction['version'];
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: IssueTransaction & WithId & WithProofs = {
    chainId: networkByte(paramsOrTx.chainId, 76),
    decimals: (paramsOrTx.decimals == null ? 8 : paramsOrTx.decimals) as AssetDecimals,
    description: paramsOrTx.description,
    fee: checkForNFT(paramsOrTx) ? fee(paramsOrTx, 100000) : fee(paramsOrTx, 100000000),
    id: '',
    name: paramsOrTx.name,
    proofs: paramsOrTx.proofs || [],
    quantity: paramsOrTx.quantity,
    reissuable: paramsOrTx.reissuable || false,
    script: paramsOrTx.script == null ? null : (base64Prefix(paramsOrTx.script) as string),
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.issue(tx);

  const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}

const checkForNFT = (paramsOrTx: {
  quantity?: string | number;
  reissuable?: boolean;
  decimals?: number;
}) => {
  const reissuable = paramsOrTx.reissuable ?? false;
  const decimals = paramsOrTx.decimals ?? 8;
  return paramsOrTx.quantity === 1 && reissuable === false && decimals === 0;
};
