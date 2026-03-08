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
  paramsOrTx: IUpdateAssetInfoParams & Partial<UpdateAssetInfoTransaction & WithProofs>,
  seed?: TSeedTypes,
): UpdateAssetInfoTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.UPDATE_ASSET_INFO;
  const version = paramsOrTx.version ?? DEFAULT_VERSIONS.UPDATE_ASSET_INFO;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);

<<<<<<< HEAD
    const tx: UpdateAssetInfoTransaction & WithId & WithProofs = {
        type,
        version,
        senderPublicKey,
        name: paramsOrTx.name,
        description: paramsOrTx.description,
        assetId: paramsOrTx.assetId,
<<<<<<< HEAD
<<<<<<< HEAD
        fee: fee(paramsOrTx, 100000),
=======
        fee: fee(paramsOrTx, 100000000000),
        feeAssetId: normalizeAssetId(paramsOrTx.feeAssetId),
>>>>>>> 697d643a (minor fixes)
=======
        fee: fee(paramsOrTx, 100000),
>>>>>>> f33083a0 (updated dependencies)
        timestamp: paramsOrTx.timestamp || Date.now(),
        proofs: paramsOrTx.proofs || [],
        chainId: networkByte(paramsOrTx.chainId, 76),
        id: '',
    }
=======
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
<<<<<<< HEAD
  }
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
=======
  };
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup)

  validate.updateAssetInfo(tx);

  const bytes = txToProtoBytes(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
