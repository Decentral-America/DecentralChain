import { describe, expect, it } from 'vitest';
import { configuredAssetIds, visibleMarkets } from '../scripts/checkNetworkMarkets.js';

describe('configuredAssetIds', () => {
  it('lists each non-native asset id once', () => {
    expect(
      configuredAssetIds({
        tradingPairs: [
          ['A', 'DCC'],
          ['B', 'A'],
        ],
      }),
    ).toEqual(['A', 'B']);
  });

  it('is empty for matcher-sourced networks', () => {
    expect(configuredAssetIds({ tradingPairs: [] })).toEqual([]);
  });
});

describe('visibleMarkets', () => {
  it('drops hidden test markets', () => {
    const markets = [
      { amountAssetName: 'E2ETestTkn', priceAssetName: 'DCC' },
      { amountAssetName: 'AUDT', priceAssetName: 'DCC' },
    ];
    expect(visibleMarkets(markets, ['E2ETestTkn'])).toEqual([markets[1]]);
  });
});
