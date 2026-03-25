/**
 * @module index
 */

import {
  base58Decode,
  base58Encode,
  blake2b,
  concat,
  crypto,
  isPrivateKey,
  privateKey,
  signBytes,
} from '@decentralchain/ts-lib-crypto';
import { type CommitToGenerationTransaction, TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { DEFAULT_VERSIONS } from '../defaultVersions';
import { addProof, convertToPairs, fee, getSenderPublicKey, networkByte } from '../generic';
import { txToProtoBytes } from '../proto-serialize';
import {
  type ICommitToGenerationParams,
  type WithId,
  type WithProofs,
  type WithSender,
} from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

const dccCrypto = crypto({ output: 'Bytes' });

const int32ToBigEndianBytes = (value: number): Uint8Array => {
  if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647) {
    throw new Error(`generationPeriodStart should be a 32-bit integer, but got: ${value}`);
  }

  const result = new Uint8Array(4);
  new DataView(result.buffer).setInt32(0, value, false);

  return result;
};

/* @echo DOCS */
// @ts-expect-error TS2394: overload incompatible due to version/chainId type widening in intersection
export function commitToGeneration(
  params: ICommitToGenerationParams,
  seed: TSeedTypes,
): CommitToGenerationTransaction & WithId & WithProofs;
export function commitToGeneration(
  paramsOrTx: (ICommitToGenerationParams & WithSender) | CommitToGenerationTransaction,
  seed?: TSeedTypes,
): CommitToGenerationTransaction & WithId & WithProofs;
export function commitToGeneration(
  paramsOrTx: ICommitToGenerationParams & Partial<CommitToGenerationTransaction & WithProofs>,
  seed?: TSeedTypes,
): CommitToGenerationTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.COMMIT_TO_GENERATION;
  const version = paramsOrTx.version ?? DEFAULT_VERSIONS.COMMIT_TO_GENERATION;
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);
  const primarySeed = seedsAndIndexes[0]?.[0];

  const shouldComputeBls =
    paramsOrTx.endorserPublicKey == null || paramsOrTx.commitmentSignature == null;

  const blsKeyPair =
    !shouldComputeBls || primarySeed == null
      ? undefined
      : dccCrypto.blsKeyPair(
          isPrivateKey(primarySeed) ? primarySeed.privateKey : privateKey(primarySeed),
        );
  const blsSecret = blsKeyPair?.blsSecret;

  const endorserPublicKey =
    paramsOrTx.endorserPublicKey == null
      ? blsKeyPair == null
        ? undefined
        : base58Encode(blsKeyPair.blsPublic)
      : paramsOrTx.endorserPublicKey;

  if (endorserPublicKey == null) {
    throw new Error(
      'Please provide either seed or endorserPublicKey for CommitToGenerationTransaction',
    );
  }

  const commitmentSignature =
    paramsOrTx.commitmentSignature == null
      ? blsSecret == null
        ? undefined
        : base58Encode(
            dccCrypto.blsSign(
              blsSecret,
              concat(
                base58Decode(endorserPublicKey),
                int32ToBigEndianBytes(paramsOrTx.generationPeriodStart),
              ),
            ),
          )
      : paramsOrTx.commitmentSignature;

  if (commitmentSignature == null) {
    throw new Error(
      'Please provide either seed or commitmentSignature for CommitToGenerationTransaction',
    );
  }

  const tx: CommitToGenerationTransaction & WithId & WithProofs = {
    chainId: networkByte(paramsOrTx.chainId, 76),
    commitmentSignature,
    endorserPublicKey,
    fee: fee(paramsOrTx, 10000000),
    generationPeriodStart: paramsOrTx.generationPeriodStart,
    id: '',
    proofs: paramsOrTx.proofs ?? [],
    senderPublicKey,
    timestamp: paramsOrTx.timestamp || Date.now(),
    type,
    version,
  };

  validate.commitToGeneraction(tx as unknown as Record<string, unknown>);

  const bytes = txToProtoBytes(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
