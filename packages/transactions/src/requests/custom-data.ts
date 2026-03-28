/**
 * @module index
 */

import { binary, schemas, serializePrimitives } from '@decentralchain/marshall';
import {
  base58Encode,
  blake2b,
  concat,
  publicKey,
  signBytes,
  type TSeed,
} from '@decentralchain/ts-lib-crypto';
import {
  type DataTransactionDeleteRequest,
  type DataTransactionEntry,
} from '@decentralchain/ts-types';
import { type TPrivateKey } from '../types';
import { validate } from '../validators';

interface ICustomDataV1 {
  version: 1;
  /**
   * base64 encoded UInt8Array
   */
  binary: string; // base64

  publicKey?: string;
}

interface ICustomDataV2 {
  version: 2;
  data: Exclude<DataTransactionEntry, DataTransactionDeleteRequest>[];
  publicKey?: string;
}

export type TCustomData = ICustomDataV1 | ICustomDataV2;

export type TSignedData = TCustomData & {
  /**
   * base58 public key
   */
  publicKey: string | undefined;
  /**
   * base58 encoded blake2b(serialized data)
   */
  hash: string;
  /**
   * base58 encoded signature
   */
  signature: string | undefined;
};

/**
 * Signs [[TCustomData]]
 */
export function customData(cData: TCustomData, seed?: TSeed | TPrivateKey): TSignedData {
  validate.customData(cData);

  const bytes = serializeCustomData(cData);

  const hash = base58Encode(blake2b(bytes));

  const pk = cData.publicKey ? cData.publicKey : seed && publicKey(seed);

  const signature = seed && signBytes(seed, bytes);

  return { ...cData, hash, publicKey: pk, signature };
}

export function serializeCustomData(d: TCustomData) {
  if (d.version === 1) {
    return concat([255, 255, 255, 1], serializePrimitives.BASE64_STRING(d.binary));
  } else if (d.version === 2) {
    const ser = binary.serializerFromSchema(schemas.txFields.data[1]);
    return concat([255, 255, 255, 2], ser(d.data));
  } else {
    // Exhaustive guard: d is typed as `never` here because TCustomData = V1 | V2
    // and both cases are handled above. If a new version is ever added to TCustomData
    // without a matching case, TypeScript will error on this assignment.
    const _exhaustive: never = d;
    throw new Error(`Invalid CustomData version: ${JSON.stringify(_exhaustive)}`);
  }
}
