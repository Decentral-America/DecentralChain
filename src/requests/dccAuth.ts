/**
 * @module index
 */
import { base58Encode, blake2b, concat, signBytes, address } from '@decentralchain/ts-lib-crypto';
import { serializePrimitives } from '@decentralchain/marshall';

const { LONG, BASE58_STRING } = serializePrimitives;
import { getSenderPublicKey, convertToPairs } from '../generic';
import { IDccAuthParams, IDccAuth } from '../transactions';
import { validate } from '../validators';
import { TSeedTypes } from '../types';

export const serializeDccAuthData = (auth: { publicKey: string; timestamp: number }) =>
  concat(BASE58_STRING(auth.publicKey), LONG(auth.timestamp));

export function dccAuth(
  params: IDccAuthParams,
  seed?: TSeedTypes,
  chainId?: string | number,
): IDccAuth {
  const seedsAndIndexes = convertToPairs(seed);
  const publicKey =
    params.publicKey || getSenderPublicKey(seedsAndIndexes, { senderPublicKey: undefined });
  const timestamp = params.timestamp || Date.now();
  validate.dccAuth({ publicKey, timestamp });

  const rx = {
    hash: '',
    signature: '',
    timestamp,
    publicKey,
    address: address({ publicKey }, chainId || 'L'),
  };

  const bytes = serializeDccAuthData(rx);

  rx.signature = seedsAndIndexes.map(([seed]) => signBytes(seed, bytes))[0] || '';
  rx.hash = base58Encode(blake2b(Uint8Array.from(bytes)));

  return rx;
}
