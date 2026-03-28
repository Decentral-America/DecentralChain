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

type BlsSigningData = { endorserPublicKey: string; commitmentSignature: string };

function resolveBlsSigningData(
  paramsOrTx: ICommitToGenerationParams & { proofs?: string[] },
  primarySeed: ReturnType<typeof convertToPairs>[number][0] | undefined,
): BlsSigningData {
  const needsComputation =
    paramsOrTx.endorserPublicKey == null || paramsOrTx.commitmentSignature == null;
  const blsKeyPair =
    !needsComputation || primarySeed == null
      ? undefined
      : dccCrypto.blsKeyPair(
          isPrivateKey(primarySeed) ? primarySeed.privateKey : privateKey(primarySeed),
        );

  const endorserPublicKey =
    paramsOrTx.endorserPublicKey ??
    (blsKeyPair != null ? base58Encode(blsKeyPair.blsPublic) : undefined);

  if (endorserPublicKey == null) {
    throw new Error(
      'Please provide either seed or endorserPublicKey for CommitToGenerationTransaction',
    );
  }

  const blsSecret = blsKeyPair?.blsSecret;
  const commitmentSignature =
    paramsOrTx.commitmentSignature ??
    (blsSecret != null
      ? base58Encode(
          dccCrypto.blsSign(
            blsSecret,
            concat(
              base58Decode(endorserPublicKey),
              int32ToBigEndianBytes(paramsOrTx.generationPeriodStart),
            ),
          ),
        )
      : undefined);

  if (commitmentSignature == null) {
    throw new Error(
      'Please provide either seed or commitmentSignature for CommitToGenerationTransaction',
    );
  }

  return { commitmentSignature, endorserPublicKey };
}

/* @echo DOCS */
export function commitToGeneration(
  params: ICommitToGenerationParams,
  seed: TSeedTypes,
): CommitToGenerationTransaction & WithId & WithProofs;
export function commitToGeneration(
  paramsOrTx: (ICommitToGenerationParams & WithSender) | CommitToGenerationTransaction,
  seed?: TSeedTypes,
): CommitToGenerationTransaction & WithId & WithProofs;
export function commitToGeneration(
  paramsOrTx: ICommitToGenerationParams & { proofs?: string[] },
  seed?: TSeedTypes,
): CommitToGenerationTransaction & WithId & WithProofs {
  const type = TRANSACTION_TYPE.COMMIT_TO_GENERATION;
  const version = (paramsOrTx.version ??
    DEFAULT_VERSIONS.COMMIT_TO_GENERATION) as CommitToGenerationTransaction['version'];
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = getSenderPublicKey(seedsAndIndexes, paramsOrTx);
  const primarySeed = seedsAndIndexes[0]?.[0];

  const { endorserPublicKey, commitmentSignature } = resolveBlsSigningData(paramsOrTx, primarySeed);

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

  validate.commitToGeneraction(tx);

  const bytes = txToProtoBytes(tx);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(tx, signBytes(s, bytes), i);
  });
  tx.id = base58Encode(blake2b(bytes));

  return tx;
}
