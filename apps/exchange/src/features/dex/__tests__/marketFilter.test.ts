import { describe, expect, it } from 'vitest';
import { type MatcherMarket, marketsToPairs } from '../marketFilter';

const market = (over: Partial<MatcherMarket>): MatcherMarket => ({
  amountAsset: 'A1',
  amountAssetName: 'AUDT',
  created: 1,
  priceAsset: 'DCC',
  priceAssetName: 'DCC',
  ...over,
});

describe('marketsToPairs', () => {
  it('drops markets whose asset name is a hidden test leftover', () => {
    const pairs = marketsToPairs(
      [
        market({ amountAsset: 'E1', amountAssetName: 'E2ETestTkn', created: 5 }),
        market({ amountAsset: 'P1', amountAssetName: 'DEXPROOF', created: 4 }),
        market({ amountAsset: 'A1', amountAssetName: 'AUDT', created: 3 }),
      ],
      ['E2ETestTkn', 'DEXPROOF'],
    );
    expect(pairs).toEqual([
      { amountAsset: 'A1', amountAssetName: 'AUDT', priceAsset: 'DCC', priceAssetName: 'DCC' },
    ]);
  });

  it('lists the newest market first and removes duplicate pairs', () => {
    const pairs = marketsToPairs(
      [
        market({ amountAsset: 'OLD', amountAssetName: 'OLD', created: 1 }),
        market({ amountAsset: 'NEW', amountAssetName: 'NEW', created: 9 }),
        market({ amountAsset: 'NEW', amountAssetName: 'NEW', created: 2 }),
      ],
      [],
    );
    expect(pairs.map((p) => p.amountAsset)).toEqual(['NEW', 'OLD']);
  });

  it('returns an empty list when every market is hidden', () => {
    expect(marketsToPairs([market({ amountAssetName: 'E2ETestTkn' })], ['E2ETestTkn'])).toEqual([]);
  });
});
