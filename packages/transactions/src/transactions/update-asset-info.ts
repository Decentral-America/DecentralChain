/**
 * @module index
 */

import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import { TRANSACTION_TYPE, type UpdateAssetInfoTransaction } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic';
import { txToProtoBytes } from '../proto-serialize';
import {
  type IUpdateAssetInfoParams,
  type WithId,
  type WithProofs,
  type WithSender,
} from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/* @echo DOCS */
export function updateAssetInfo(
  params: IUpdateAssetInfoParams,
  seed: TSeedTypes,
): UpdateAssetInfoTransaction & WithId & WithProofs;
export function updateAssetInfo(
  paramsOrTx: (IUpdateAssetInfoParams & WithSender) | UpdateAssetInfoTransaction,
  seed?: TSeedTypes,
): UpdateAssetInfoTransaction & WithId & WithProofs;
export function updateAssetInfo(
  paramsOrTx: IUpdateAssetInfoParams & { proofs?: string[] },
  seed?: TSeedTypes,
): UpdateAssetInfoTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.UPDATE_ASSET_INFO;
  const version = (paramsOrTx.version ??
    DEFAULT_VERSIONS.UPDATE_ASSET_INFO) as UpdateAssetInfoTransaction['version'];
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: UpdateAssetInfoTransaction & WithId & WithProofs = {
    assetId: paramsOrTx.assetId,
    chainId: networkByte(paramsOrTx.chainId, 76),
    description: paramsOrTx.description,
    fee: fee(paramsOrTx, 100000),
    id: '',
    name: paramsOrTx.name,
    proofs: paramsOrTx.proofs || [],
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.updateAssetInfo(tx);

  const bytes = txToProtoBytes(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
