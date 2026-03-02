import transformer from '../transform';
import { ApiTypes } from '../types';

describe('Default transformer', () => {
  it('transforms a list by recursively transforming each item', () => {
    const input = {
      __type: ApiTypes.List,
      data: [
        { __type: ApiTypes.Transaction, data: { id: 'tx1' } },
        { __type: ApiTypes.Transaction, data: { id: 'tx2' } },
      ],
    };
    const result = transformer(input);
    expect(result).toEqual([{ id: 'tx1' }, { id: 'tx2' }]);
  });

  it('returns data as-is for transaction type', () => {
    const input = { __type: ApiTypes.Transaction, data: { id: 'tx1', amount: 100 } };
    const result = transformer(input);
    expect(result).toEqual({ id: 'tx1', amount: 100 });
  });

  it('returns data as-is for alias type', () => {
    const input = { __type: ApiTypes.Alias, data: { address: 'addr', alias: 'myAlias' } };
    const result = transformer(input);
    expect(result).toEqual({ address: 'addr', alias: 'myAlias' });
  });

  it('returns identity for pair type', () => {
    const pairData = { amountAsset: 'DCC', priceAsset: 'BTC' };
    const input = { __type: ApiTypes.Pair, data: pairData };
    const result = transformer(input);
    expect(result).toEqual(pairData);
  });

  it('transforms asset type using Asset constructor when data is not null', () => {
    const assetData = {
      id: 'test-asset',
      name: 'Test',
      precision: 8,
      description: '',
      height: 1,
      timestamp: new Date().toISOString(),
      sender: 'sender',
      quantity: '1000000',
      reissuable: false,
      hasScript: false,
      minSponsoredFee: '0',
    };
    const input = { __type: ApiTypes.Asset, data: assetData };
    const result = transformer(input);
    // Asset constructor returns an object with matching id
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.id).toBe('test-asset');
  });

  it('returns null for asset type when data is null', () => {
    const input = { __type: ApiTypes.Asset, data: null };
    const result = transformer(input);
    expect(result).toBeNull();
  });

  it('returns null for candle type when data is null', () => {
    const input = { __type: ApiTypes.Candle, data: null };
    const result = transformer(input);
    expect(result).toBeNull();
  });

  it('returns the original object for unknown types', () => {
    const input = { __type: 'unknown', data: { foo: 'bar' }, extra: 123 };
    const result = transformer(input);
    expect(result).toEqual({ __type: 'unknown', data: { foo: 'bar' }, extra: 123 });
  });

  it('handles nested list with mixed types', () => {
    const input = {
      __type: ApiTypes.List,
      data: [
        { __type: ApiTypes.Alias, data: { address: 'a', alias: 'b' } },
        { __type: ApiTypes.Transaction, data: { id: 'tx1' } },
      ],
    };
    const result = transformer(input);
    expect(result).toEqual([{ address: 'a', alias: 'b' }, { id: 'tx1' }]);
  });

  it('returns null when input is null', () => {
    expect(transformer(null)).toBeNull();
  });

  it('returns undefined when input is undefined', () => {
    expect(transformer(undefined)).toBeUndefined();
  });

  it('throws when list type has non-array data', () => {
    const input = { __type: ApiTypes.List, data: null };
    expect(() => transformer(input)).toThrow('expected array for list type');
  });

  it('throws when list type has data as string', () => {
    const input = { __type: ApiTypes.List, data: 'not-an-array' };
    expect(() => transformer(input)).toThrow('expected array for list type');
  });
});
