/**
 * @module index
 */

import { serializePrimitives } from '@decentralchain/marshall';
import { base58Encode, blake2b, concat, signBytes } from '@decentralchain/ts-lib-crypto';

const { BASE58_STRING } = serializePrimitives;

import { convertToPairs, getSenderPublicKey } from '../generic';
import { type ICancelOrder, type ICancelOrderParams } from '../transactions';
import { type TPrivateKey } from '../types';
import { validate } from '../validators';

export const cancelOrderParamsToBytes = (cancelOrderParams: { sender: string; orderId: string }) =>
  concat(BASE58_STRING(cancelOrderParams.sender), BASE58_STRING(cancelOrderParams.orderId));

export function cancelOrder(params: ICancelOrderParams, seed?: string | TPrivateKey): ICancelOrder {
  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey = params.senderPublicKey || getSenderPublicKey(seedsAndIndexes, {});
  const bytes = concat(BASE58_STRING(senderPublicKey), BASE58_STRING(params.orderId));
  const signature = params.signature || (seed != null && signBytes(seed, bytes)) || '';
  const hash = base58Encode(blake2b(Uint8Array.from(bytes)));

  const cancelOrderBody: ICancelOrder = {
    sender: senderPublicKey,
    orderId: params.orderId,
    signature,
    hash,
  };

  validate.cancelOrder(cancelOrderBody as unknown as Record<string, unknown>);

  return cancelOrderBody;
}
