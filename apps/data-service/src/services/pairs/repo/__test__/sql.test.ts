import { SortOrder } from '../../../_common';
import { get, mget, search } from '../sql';

describe('sql query from pairs', () => {
  it('should get one pair', () => {
    expect(
      get({
        matcher: '333',
        pair: {
          amountAsset: '111',
          priceAsset: '222',
        },
      }),
    ).toMatchSnapshot();
  });

  it('should get many pairs', () => {
    expect(
      mget({
        matcher: '555',
        pairs: [
          {
            amountAsset: '111',
            priceAsset: '222',
          },
          {
            amountAsset: '333',
            priceAsset: '444',
          },
        ],
      }),
    ).toMatchSnapshot();
  });

  it('should search pairs for one asset', () => {
    expect(
      search({
        limit: 10,
        match_exactly: [false],
        matcher: '',
        search_by_asset: '7FJhS4wyEKqsp77VCMfCZWKLSMuy1TWskYAyZ28amWFj',
        sort: SortOrder.Descending,
      }),
    ).toMatchSnapshot();
  });

  it('should search pairs for one asset exactly', () => {
    expect(
      search({
        limit: 10,
        match_exactly: [true],
        matcher: '',
        search_by_asset: '7FJhS4wyEKqsp77VCMfCZWKLSMuy1TWskYAyZ28amWFj',
        sort: SortOrder.Descending,
      }),
    ).toMatchSnapshot();
  });

  it('should search pairs for one asset exactly', () => {
    expect(
      search({
        limit: 10,
        match_exactly: [true],
        matcher: '',
        search_by_asset: '¯\\_(ツ)_/¯',
        sort: SortOrder.Descending,
      }),
    ).toMatchSnapshot();
  });

  it('should search pairs for two assets (amount and price)', () => {
    expect(
      search({
        limit: 10,
        match_exactly: [false, false],
        matcher: '',
        search_by_assets: ['BTC', 'WAVES'],
        sort: SortOrder.Descending,
      }),
    ).toMatchSnapshot();
  });

  it('should search pairs for two assets (amount and price)', () => {
    expect(
      search({
        limit: 10,
        match_exactly: [false],
        matcher: '',
        search_by_assets: ['¯\\_(ツ)_/¯', 'WAVES'],
        sort: SortOrder.Descending,
      }),
    ).toMatchSnapshot();
  });

  it('should search pairs for two assets (amount and price)', () => {
    expect(
      search({
        limit: 10,
        match_exactly: [true, false],
        matcher: '',
        search_by_assets: ['¯\\_(ツ)_/¯', 'WAVES'],
        sort: SortOrder.Descending,
      }),
    ).toMatchSnapshot();
  });
});
