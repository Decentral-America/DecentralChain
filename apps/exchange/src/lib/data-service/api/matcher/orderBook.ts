import { BigNumber } from '@decentralchain/bignumber';
import { type AssetPair, Money, OrderPrice } from '@decentralchain/data-entities';
import { get as getConfig } from '../../config';
import { request } from '../../utils/request';
import { addParam } from '../../utils/utils';
import { get as getAssetPair } from '../pairs/pairs';

export function get(asset1: string, asset2: string): Promise<IOrderBook> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<IOrderBook>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request timeout!')), 3000);
  });

  const promise = getAssetPair(asset1, asset2).then(async (pair) => {
    clearTimeout(timer);
    const result = await request({ url: `${getConfig('matcher')}/orderbook/${pair.toString()}` });
    return addParam(remapOrderBook, pair)(result);
  });

  return Promise.race([promise, timeout]);
}

function remapOrderBook(orderBook, pair: AssetPair): IOrderBook {
  const remap = remapOrder(pair);
  return {
    asks: orderBook.asks.map(remap),
    bids: orderBook.bids.map(remap),
    pair,
  };
}

const remapOrder =
  (pair: AssetPair) =>
  (order: IApiOrder): IOrder => ({
    amount: new Money(order.amount, pair.amountAsset),
    price: Money.fromTokens(
      OrderPrice.fromMatcherCoins(new BigNumber(order.price), pair).getTokens(),
      pair.priceAsset,
    ),
  });

export interface IOrderBook {
  pair: AssetPair;
  bids: Array<IOrder>;
  asks: Array<IOrder>;
}

export interface IOrder {
  amount: Money;
  price: Money;
}

interface IApiOrder {
  amount: string;
  price: string;
}
