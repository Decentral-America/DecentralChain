/**
 * @module index
 */

import { serializePrimitives } from '@decentralchain/marshall';
import { address, base58Encode, blake2b, concat, signBytes } from '@decentralchain/ts-lib-crypto';

const { LONG, BASE58_STRING } = serializePrimitives;

import { convertToPairs, getSenderPublicKey } from '../generic';
import { type IDccAuth, type IDccAuthParams } from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

export const serializeDccAuthData = (auth: { publicKey: string; timestamp: number }) =>
  concat(BASE58_STRING(auth.publicKey), LONG(auth.timestamp));

export function dccAuth(
  params: IDccAuthParams,
  seed?: TSeedTypes,
  chainId?: string | number,
): IDccAuth {
  const seedsAndIndexes = convertToPairs(seed);
  const publicKey = params.publicKey || getSenderPublicKey(seedsAndIndexes, {});
  const timestamp = params.timestamp || Date.now();
  validate.dccAuth({ publicKey, timestamp });

  const rx = {
    hash: '',
    signature: '',
    timestamp,
    publicKey,
    address: address({ publicKey }, chainId ?? 'L'),
  };

  const bytes = serializeDccAuthData(rx);

  rx.signature = (seedsAndIndexes.length > 0 && signBytes(seedsAndIndexes[0]![0], bytes)) || '';
  rx.hash = base58Encode(blake2b(Uint8Array.from(bytes)));

  return rx;
}
