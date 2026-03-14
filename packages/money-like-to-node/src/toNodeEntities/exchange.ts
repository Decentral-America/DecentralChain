import {
  type ExchangeTransaction,
  type ExchangeTransactionOrder,
  type SignedIExchangeTransactionOrder,
} from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { type TLong, type TMoney, type TWithPartialFee } from '../types/index.js';
import { getAssetId, getCoins } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

const getAssetPair = (data: IDCCGuiExchangeOrder) => ({
  amountAsset: getAssetId(data.amount),
  priceAsset: getAssetId(data.price),
});

// The order/exchange types are unions (V1 | V2 | V3 | V4) with literal version
// fields. TypeScript distributes factory's constraint across each union member,
// so we implement these as plain functions to keep things clean.
export const remapOrder = (
  data: IDCCGuiExchangeOrder,
): SignedIExchangeTransactionOrder<ExchangeTransactionOrder<string>> => {
  const base = {
    amount: getCoins(data.amount),
    assetPair: getAssetPair(data),
    expiration: data.expiration,
    matcherFee: getCoins(data.matcherFee),
    matcherFeeAssetId: getAssetId(data.matcherFee),
    matcherPublicKey: data.matcherPublicKey,
    orderType: data.orderType,
    price: getCoins(data.price),
    senderPublicKey: data.senderPublicKey,
    timestamp: data.timestamp,
    version: data.version,
    ...(data.chainId != null ? { chainId: data.chainId } : {}),
    ...(data.priceMode != null ? { priceMode: data.priceMode } : {}),
    proofs: data.proofs,
  };
  return base as unknown as SignedIExchangeTransactionOrder<ExchangeTransactionOrder<string>>;
};

const defaultTransformFns = getDefaultTransform();

export const exchange = (data: IDCCGuiExchange): TWithPartialFee<ExchangeTransaction<string>> => {
  const base = {
    fee: defaultTransformFns.fee(data),
    senderPublicKey: defaultTransformFns.senderPublicKey(data),
    timestamp: defaultTransformFns.timestamp(data),
    type: defaultTransformFns.type(data),
    version: defaultTransformFns.version(data),
    ...(data.chainId != null ? { chainId: data.chainId } : {}),
    amount: getCoins(data.amount),
    buyMatcherFee: getCoins(data.buyMatcherFee),
    order1: remapOrder(data.buyOrder),
    order2: remapOrder(data.sellOrder),
    price: getCoins(data.price),
    sellMatcherFee: getCoins(data.sellMatcherFee),
  };
  return base as unknown as TWithPartialFee<ExchangeTransaction<string>>;
};

export interface IDCCGuiExchange extends IDefaultGuiTx<typeof TYPES.EXCHANGE> {
  buyOrder: IDCCGuiExchangeOrder;
  sellOrder: IDCCGuiExchangeOrder;
  price: TLong;
  amount: TLong;
  buyMatcherFee: TMoney;
  sellMatcherFee: TMoney;
}

export interface IDCCGuiExchangeOrder {
  version: number;
  matcherPublicKey: string;
  orderType: 'buy' | 'sell';
  price: TMoney;
  amount: TMoney;
  matcherFee: TMoney;
  timestamp: number;
  expiration: number;
  senderPublicKey: string;
  proofs: string[];
  chainId?: number | undefined;
  priceMode?: 'fixedDecimals' | 'assetDecimals' | undefined;
}
