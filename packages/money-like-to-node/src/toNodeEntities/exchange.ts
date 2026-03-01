import type {
  IExchangeTransaction,
  IExchangeTransactionOrderWithProofs,
} from '@decentralchain/ts-types';
import type { TLong, TMoney, TWithPartialFee } from '../types/index.js';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { getAssetId, getCoins, pipe, prop } from '../utils/index.js';

const getAssetPair = factory<IDCCGuiExchangeOrder, { amountAsset: string; priceAsset: string }>({
  amountAsset: pipe<IDCCGuiExchangeOrder, TMoney, string>(prop('amount'), getAssetId),
  priceAsset: pipe<IDCCGuiExchangeOrder, TMoney, string>(prop('price'), getAssetId),
});

export const remapOrder = factory<
  IDCCGuiExchangeOrder,
  IExchangeTransactionOrderWithProofs<string>
>({
  version: prop('version'),
  matcherPublicKey: prop('matcherPublicKey'),
  orderType: prop('orderType'),
  timestamp: prop('timestamp'),
  expiration: prop('expiration'),
  senderPublicKey: prop('senderPublicKey'),
  proofs: prop('proofs'),
  price: pipe<IDCCGuiExchangeOrder, TMoney, string>(prop('price'), getCoins),
  amount: pipe<IDCCGuiExchangeOrder, TMoney, string>(prop('amount'), getCoins),
  matcherFee: pipe<IDCCGuiExchangeOrder, TMoney, string>(prop('matcherFee'), getCoins),
  matcherFeeAssetId: pipe<IDCCGuiExchangeOrder, TMoney, string>(prop('matcherFee'), getAssetId),
  assetPair: getAssetPair,
  // @ts-expect-error chainId not yet in @decentralchain/ts-types IExchangeTransactionOrderWithProofs
  chainId: prop('chainId'),
  // @ts-expect-error priceMode not yet in @decentralchain/ts-types IExchangeTransactionOrderWithProofs
  priceMode: prop('priceMode'),
});

export const exchange = factory<IDCCGuiExchange, TWithPartialFee<IExchangeTransaction<string>>>({
  ...getDefaultTransform(),
  buyOrder: pipe(prop('buyOrder'), remapOrder),
  sellOrder: pipe(prop('sellOrder'), remapOrder),
  price: pipe<IDCCGuiExchange, TLong, string>(prop('price'), getCoins),
  amount: pipe<IDCCGuiExchange, TLong, string>(prop('amount'), getCoins),
  buyMatcherFee: pipe<IDCCGuiExchange, TMoney, string>(prop('buyMatcherFee'), getCoins),
  sellMatcherFee: pipe<IDCCGuiExchange, TMoney, string>(prop('sellMatcherFee'), getCoins),
});

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
