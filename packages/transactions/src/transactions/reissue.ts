/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { type ReissueTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic';
import { txToProtoBytes } from '../proto-serialize';
import {
  type IReissueParams,
  type WithId,
  type WithProofs,
  type WithSender,
} from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

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
  paramsOrTx: IReissueParams & { proofs?: string[] },
  seed?: TSeedTypes,
): ReissueTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.REISSUE;
  const version = (paramsOrTx.version ?? DEFAULT_VERSIONS.REISSUE) as ReissueTransaction['version'];
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: ReissueTransaction & WithId & WithProofs = {
    assetId: paramsOrTx.assetId,
    chainId: networkByte(paramsOrTx.chainId, 76),
    fee: fee(paramsOrTx, 100000),
    id: '',
    proofs: paramsOrTx.proofs || [],
    quantity: paramsOrTx.quantity,
    reissuable: paramsOrTx.reissuable,
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.reissue(tx);

  const bytes = version > 2 ? txToProtoBytes(tx) : binary.serializeTx(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
