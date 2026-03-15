import { BigNumber } from '@decentralchain/bignumber';
import { type AssetPair, Money, OrderPrice } from '@decentralchain/data-entities';
import { get } from '../../config';
import { request } from '../../utils/request';

export function getLastPrice(pair: AssetPair) {
  return request({
    url: `${get('matcher')}/orderbook/${pair.amountAsset.id}/${pair.priceAsset.id}/status`,
  }).then(({ lastPrice, lastSide }) => {
    const orderPrice = new OrderPrice(new BigNumber(lastPrice), pair).getTokens();
    const price = new Money(0, pair.priceAsset).cloneWithTokens(orderPrice);
    return { lastSide, price };
  });
}
