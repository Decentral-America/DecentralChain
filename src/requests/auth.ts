/**
 * @module index
 */

import { serializePrimitives } from '@decentralchain/marshall';
import { address, base58Encode, blake2b, concat, signBytes } from '@decentralchain/ts-lib-crypto';

const { STRING, LEN, SHORT } = serializePrimitives;

import { convertToPairs, getSenderPublicKey } from '../generic';
import { type IAuth, type IAuthParams } from '../transactions';
import { type TPrivateKey } from '../types';
import { validate } from '../validators';

export const serializeAuthData = (auth: { host: string; data: string }) =>
  concat(
    LEN(SHORT)(STRING)('DccWalletAuthentication'),
    LEN(SHORT)(STRING)(auth.host || ''),
    LEN(SHORT)(STRING)(auth.data || ''),
  );

export function auth(
  params: IAuthParams,
  seed?: string | TPrivateKey,
  chainId?: string | number,
): IAuth {
  const seedsAndIndexes = convertToPairs(seed);
  const publicKey = params.publicKey || getSenderPublicKey(seedsAndIndexes, {});

  validate.auth(params as unknown as Record<string, unknown>);

  const rx = {
    hash: '',
    signature: '',
    host: params.host,
    data: params.data,
    publicKey,
    address: address({ publicKey }, chainId ?? 'L'),
  };

  const bytes = serializeAuthData(rx);

  rx.signature = (seed != null && signBytes(seed, bytes)) || '';
  rx.hash = base58Encode(blake2b(Uint8Array.from(bytes)));

  return rx;
}
