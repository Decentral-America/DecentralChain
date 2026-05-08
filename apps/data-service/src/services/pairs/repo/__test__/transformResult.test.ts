import { BigNumber } from '@decentralchain/data-entities';
import { transformResult } from '../transformResult';

describe('sql query results transformation', () => {
  it('should return pair without asset and price asset for get one or many pair', () => {
    expect(
      transformResult({
        amount_asset_id: '111',
        first_price: new BigNumber(1.2),
        high: new BigNumber(3.0),
        last_price: new BigNumber(2.1),
        low: new BigNumber(0.5),
        price_asset_id: '222',
        quote_volume: new BigNumber(50.0),
        txs_count: 42,
        volume: new BigNumber(100.1),
        volume_waves: new BigNumber(10.2),
        weighted_average_price: new BigNumber(1.5),
      }),
    ).toEqual({
      amountAsset: '111',
      firstPrice: new BigNumber(1.2),
      high: new BigNumber(3.0),
      lastPrice: new BigNumber(2.1),
      low: new BigNumber(0.5),
      priceAsset: '222',
      quoteVolume: new BigNumber(50.0),
      txsCount: 42,
      volume: new BigNumber(100.1),
      volumeWaves: new BigNumber(10.2),
      weightedAveragePrice: new BigNumber(1.5),
    });
  });
});
