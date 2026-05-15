/**
 * @module index
 */

import { serializePrimitives } from '@decentralchain/marshall';
import { address, base58Encode, blake2b, concat, signBytes } from '@decentralchain/ts-lib-crypto';
import { convertToPairs, getSenderPublicKey } from '../generic';
import { type IDccAuth, type IDccAuthParams } from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

const { LONG, BASE58_STRING } = serializePrimitives;

export const serializeDccAuthData = (auth: { publicKey: string; timestamp: number }) =>
  concat(BASE58_STRING(auth.publicKey), LONG(auth.timestamp));

export function dccAuth(
  params: IDccAuthParams,
  seed?: TSeedTypes,
  chainId?: string | number,
): IDccAuth {
  const seedsAndIndexes = convertToPairs(seed);
  // biome-ignore lint/nursery/useNullishCoalescing: empty string publicKey is a valid sentinel meaning "derive from seed" — || truthy fallback is intentional
  const publicKey = params.publicKey || getSenderPublicKey(seedsAndIndexes, {});
  const timestamp = params.timestamp ?? Date.now();
  validate.dccAuth({ publicKey, timestamp });

  const rx = {
    address: address({ publicKey }, chainId ?? '?'),
    hash: '',
    publicKey,
    signature: '',
    timestamp,
  };

  const bytes = serializeDccAuthData(rx);

  const firstSeed = seedsAndIndexes[0];
  rx.signature = (firstSeed != null && signBytes(firstSeed[0], bytes)) || '';
  rx.hash = base58Encode(blake2b(Uint8Array.from(bytes)));

  return rx;
}
