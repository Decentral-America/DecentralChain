/**
 * @module index
 */

import { binary } from '@decentralchain/marshall';
import { base58Encode, blake2b, signBytes } from '@decentralchain/ts-lib-crypto';
import {
  type ExchangeTransactionOrder,
  type SignedIExchangeTransactionOrder,
} from '@decentralchain/ts-types';
import { addProof, convertToPairs, getSenderPublicKey, isOrder, networkByte } from '../generic';
import { orderToProtoBytes } from '../proto-serialize';
import { type IOrderParams, type WithId, type WithProofs, type WithSender } from '../transactions';
import { type TSeedTypes } from '../types';
import { validate } from '../validators';

/**
 * Creates and signs [[TOrder]].
 *
 * You can use this function with multiple seeds. In this case it will sign order accordingly and will add one proof per seed.
 * Also you can use already signed [[Order]] as a second agrument.
 *
 * ### Usage
 * ```js
 * const { order } = require('@decentralchain/transactions')
 *
 * const seed = 'b716885e9ba64442b4f1263c8e2d8671e98b800c60ec4dc2a27c83e5f9002b18'
 *
 * const params = {
 *   amount: 100000000, //1 DCC
 *   price: 10, //for 0.00000010 BTC
 *   priceAsset: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
 *   matcherPublicKey: '7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy',
 *   orderType: 'buy'
 * }
 *
 *
 * const signedOrder = order(params, seed)
 * ```
 * ### Output
 * ```json
 * {
 *   "id": "47YGqHdHtNPjcjE69E9EX9aD9bpC8PRKr4kp5AcZKHFq",
 *   "orderType": "buy",
 *   "assetPair": {
 *     "priceAsset": "8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS"
 *   },
 *   "price": 10,
 *   "amount": 100000000,
 *   "timestamp": 1540898977249,
 *   "expiration": 1542626977249,
 *   "matcherFee": 300000,
 *   "matcherPublicKey": "7kPFrHDiGw1rCm7LPszuECwWYL3dMf6iMifLRDJQZMzy",
 *   "senderPublicKey": "G62H1XE5rnaCgCCURV5pWwQHzWezZB7VkkVgqthdKgkj",
 *   "proofs": [
 *     "4MbaDLkx9ezV1DrcGRfXRfnMBtYLaeLYBe6YGqkkuq1Pe6U9Qc5Cv7Fy1zYyGatbg47U5j374iAQFbLLZiYBChgU"
 *   ]
 * }
 * ```
 *
 */
function applyVersionedOrderFields(
  ord: SignedIExchangeTransactionOrder<ExchangeTransactionOrder> & WithId & WithProofs,
  orderExt: IOrderParams & WithSender,
): void {
  if (ord.version >= 3) {
    Object.assign(ord, {
      matcherFeeAssetId: orderExt.matcherFeeAssetId === 'DCC' ? null : orderExt.matcherFeeAssetId,
    });
  }
  if (ord.version === 4) {
    ord.priceMode = orderExt.priceMode || 'fixedDecimals';
    Object.assign(ord, { chainId: networkByte(orderExt.chainId, 76) });
    if (orderExt.eip712Signature) Object.assign(ord, { eip712Signature: orderExt.eip712Signature });
  }
}

/* @echo DOCS */
export function order(
  paramsOrOrder: IOrderParams,
  seed: TSeedTypes,
): SignedIExchangeTransactionOrder<ExchangeTransactionOrder>;
export function order(
  paramsOrOrder: (IOrderParams & WithSender) | (ExchangeTransactionOrder & WithProofs & WithSender),
  seed?: TSeedTypes,
): SignedIExchangeTransactionOrder<ExchangeTransactionOrder>;
export function order(
  paramsOrOrder: IOrderParams | (ExchangeTransactionOrder & WithProofs & WithSender),
  seed?: TSeedTypes,
): SignedIExchangeTransactionOrder<ExchangeTransactionOrder> {
  const amountAsset = isOrder(paramsOrOrder)
    ? paramsOrOrder.assetPair.amountAsset
    : paramsOrOrder.amountAsset;
  const priceAsset = isOrder(paramsOrOrder)
    ? paramsOrOrder.assetPair.priceAsset
    : paramsOrOrder.priceAsset;
  const proofs = isOrder(paramsOrOrder) ? paramsOrOrder.proofs : [];

  const { matcherFee, matcherPublicKey, price, amount, orderType, expiration, timestamp } =
    paramsOrOrder;
  const t = timestamp || Date.now();

  const seedsAndIndexes = convertToPairs(seed);
  const senderPublicKey =
    paramsOrOrder.senderPublicKey || getSenderPublicKey(seedsAndIndexes, paramsOrOrder);

  // Access optional fields that exist on IOrderParams but not on ExchangeTransactionOrder
  const orderExt = paramsOrOrder as IOrderParams & WithSender;

  // Use old versionless order only if it is set to null explicitly
  const version = orderExt.version === null ? undefined : orderExt.version;
  const ord = {
    amount,
    assetPair: {
      amountAsset,
      priceAsset,
    },
    expiration: expiration || t + 29 * 24 * 60 * 60 * 1000,
    id: '',
    matcherFee: matcherFee ?? 300000,
    matcherFeeAssetId: null,
    matcherPublicKey,
    orderType,
    price,
    priceMode: orderExt.priceMode ?? 'fixedDecimals',
    proofs,
    senderPublicKey,
    timestamp: t,
    version: version as SignedIExchangeTransactionOrder<ExchangeTransactionOrder>['version'],
  } as SignedIExchangeTransactionOrder<ExchangeTransactionOrder> & WithId & WithProofs;

  applyVersionedOrderFields(ord, orderExt);

  const bytes = ord.version > 3 ? orderToProtoBytes(ord) : binary.serializeOrder(ord);

  seedsAndIndexes.forEach(([s, i]) => {
    addProof(ord, signBytes(s, bytes), i);
  });

  validate.order(ord);

  ord.id = base58Encode(blake2b(bytes));

  // OrderV1 uses signature instead of proofs
  if (ord.version === undefined || ord.version === 1) {
    // At runtime, proofs always exists on ord even for v1; TypeScript narrows the
    // versioned union so we access it through a plain object cast.
    const firstProof = (ord as { proofs?: string[] }).proofs?.[0];
    (ord as { signature?: string }).signature = firstProof ?? '';
  }

  return ord;
}
