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
// @ts-expect-error TS2394: overload incompatible due to version/chainId type widening in intersection
export function updateAssetInfo(
  params: IUpdateAssetInfoParams,
  seed: TSeedTypes,
): UpdateAssetInfoTransaction & WithId & WithProofs;
export function updateAssetInfo(
  paramsOrTx: (IUpdateAssetInfoParams & WithSender) | UpdateAssetInfoTransaction,
  seed?: TSeedTypes,
): UpdateAssetInfoTransaction & WithId & WithProofs;
export function updateAssetInfo(
  paramsOrTx: IUpdateAssetInfoParams & Partial<UpdateAssetInfoTransaction & WithProofs>,
  seed?: TSeedTypes,
): UpdateAssetInfoTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.UPDATE_ASSET_INFO;
  const version = paramsOrTx.version ?? DEFAULT_VERSIONS.UPDATE_ASSET_INFO;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

  const tx: UpdateAssetInfoTransaction & WithId & WithProofs = {
    type,
    version,
    senderPublicKey,
    name: paramsOrTx.name,
    description: paramsOrTx.description,
    assetId: paramsOrTx.assetId,
    fee: fee(paramsOrTx, 100000),
    timestamp: paramsOrTx.timestamp || Date.now(),
    proofs: paramsOrTx.proofs || [],
    chainId: networkByte(paramsOrTx.chainId, 76),
    id: '',
  };

  validate.updateAssetInfo(tx as unknown as Record<string, unknown>);

  const bytes = txToProtoBytes(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
