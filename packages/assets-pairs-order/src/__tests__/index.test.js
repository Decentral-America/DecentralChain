import { describe, it, expect } from 'vitest';
import { createOrderPair, MAINNET_DATA, TESTNET_DATA, ARBITRARY_DATA } from '../index.js';
import { compareUint8Arrays } from '../utils.js';

const orderPair = createOrderPair(MAINNET_DATA);

describe('orderPair utility', () => {
  /**
   * Simple tests for proof-of-existence
   */
  it('is function', () => {
    expect(typeof orderPair).toBe('function');
  });
  it('has both default and named exports', () => {
    expect(createOrderPair).toBeDefined();
    expect(MAINNET_DATA).toBeDefined();
    expect(TESTNET_DATA).toBeDefined();
    expect(ARBITRARY_DATA).toBeDefined();
  });

  /**
   * Data exports are frozen (immutable)
   */
  it('exports frozen MAINNET_DATA', () => {
    expect(Object.isFrozen(MAINNET_DATA)).toBe(true);
  });
  it('exports frozen TESTNET_DATA', () => {
    expect(Object.isFrozen(TESTNET_DATA)).toBe(true);
  });
  it('exports frozen ARBITRARY_DATA', () => {
    expect(Object.isFrozen(ARBITRARY_DATA)).toBe(true);
  });

  /**
   * Input validation
   */
  it('throws TypeError when predefinedList is not an array', () => {
    expect(() => createOrderPair('not-an-array', 'a', 'b')).toThrow(TypeError);
    expect(() => createOrderPair(null, 'a', 'b')).toThrow(TypeError);
    expect(() => createOrderPair(42, 'a', 'b')).toThrow(TypeError);
  });
  it('throws TypeError when first asset ID is not a string', () => {
    expect(() => orderPair(123, 'b')).toThrow(TypeError);
    expect(() => orderPair(null, 'b')).toThrow(TypeError);
    expect(() => orderPair(undefined, 'b')).toThrow(TypeError);
  });
  it('throws TypeError when second asset ID is not a string', () => {
    expect(() => orderPair('a', 123)).toThrow(TypeError);
    expect(() => orderPair('a', null)).toThrow(TypeError);
    expect(() => orderPair('a', undefined)).toThrow(TypeError);
  });
  it('includes informative error messages', () => {
    expect(() => createOrderPair(42, 'a', 'b')).toThrow(/Expected predefinedList to be an array/);
    expect(() => orderPair(42, 'b')).toThrow(/Expected first asset ID to be a string/);
    expect(() => orderPair('a', 42)).toThrow(/Expected second asset ID to be a string/);
  });

  /**
   * Arguments handling
   */
  it('accepts (string, string)', () => {
    expect(() =>
      orderPair(
        'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
        'DNhP2zAH5HM1kdUSmxcBqs8RP4vvUgRFc1YgAKkfPmPD',
      ),
    ).not.toThrow();
    expect(
      orderPair(
        'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
        'DNhP2zAH5HM1kdUSmxcBqs8RP4vvUgRFc1YgAKkfPmPD',
      ),
    ).toHaveLength(2);
  });

  /**
   * Return value structure
   */
  it('returns an array of exactly two strings', () => {
    const result = orderPair(
      'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
      'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe('string');
    expect(typeof result[1]).toBe('string');
  });
  it('always returns both original assets (no data loss)', () => {
    const a = 'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck';
    const b = 'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU';
    const result = orderPair(a, b);
    expect(result).toContain(a);
    expect(result).toContain(b);
  });

  /**
   * Business logic — mainnet priority ordering
   */
  it('orders [USD,EUR] in [EUR,USD]', () => {
    expect(
      orderPair(
        'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
        'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
      ),
    ).toEqual([
      'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
      'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
    ]);
  });
  it('orders [EUR,USD] in [EUR,USD]', () => {
    expect(
      orderPair(
        'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
        'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
      ),
    ).toEqual([
      'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
      'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
    ]);
  });
  it('orders [EUR, unknown] with known asset as price', () => {
    expect(
      orderPair(
        'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
        'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
      ),
    ).toEqual([
      'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
      'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
    ]);
  });
  it('orders [unknown, EUR] with known asset as price', () => {
    expect(
      orderPair(
        'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
        'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
      ),
    ).toEqual([
      'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
      'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
    ]);
  });
  it('orders two unknown assets deterministically by base58 comparison', () => {
    const result1 = orderPair(
      'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
      'DNhP2zAH5HM1kdUSmxcBqs8RP4vvUgRFc1YgAKkfPmPD',
    );
    const result2 = orderPair(
      'DNhP2zAH5HM1kdUSmxcBqs8RP4vvUgRFc1YgAKkfPmPD',
      'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
    );
    expect(result1).toEqual(result2);
    expect(result1).toEqual([
      'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
      'DNhP2zAH5HM1kdUSmxcBqs8RP4vvUgRFc1YgAKkfPmPD',
    ]);
  });
  it('orders [USD, DCC] in [DCC, USD]', () => {
    expect(orderPair('Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck', 'DCC')).toEqual([
      'DCC',
      'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
    ]);
  });
  it('orders [DCC, USD] in [DCC, USD]', () => {
    expect(orderPair('DCC', 'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck')).toEqual([
      'DCC',
      'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
    ]);
  });

  /**
   * Symmetry — ordering must be the same regardless of argument order
   */
  it('is symmetric: orderPair(a, b) === orderPair(b, a) for known assets', () => {
    const usd = 'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck';
    const eur = 'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU';
    expect(orderPair(usd, eur)).toEqual(orderPair(eur, usd));
  });
  it('is symmetric: orderPair(a, b) === orderPair(b, a) for mixed known/unknown', () => {
    const eur = 'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU';
    const unknown = 'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA';
    expect(orderPair(eur, unknown)).toEqual(orderPair(unknown, eur));
  });

  /**
   * Edge cases
   */
  it('handles same asset passed as both arguments', () => {
    const asset = 'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck';
    const result = orderPair(asset, asset);
    expect(result).toEqual([asset, asset]);
  });
  it('works with an empty priority list', () => {
    const emptyOrder = createOrderPair([]);
    // With no priority list, falls back to base58 comparison
    const result = emptyOrder(
      'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
      'DNhP2zAH5HM1kdUSmxcBqs8RP4vvUgRFc1YgAKkfPmPD',
    );
    expect(result).toHaveLength(2);
  });
  it('works with a single-element priority list', () => {
    const singleOrder = createOrderPair(['DCC']);
    const result = singleOrder('FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA', 'DCC');
    expect(result[1]).toBe('DCC'); // known asset is always price
  });

  /**
   * Currying
   */
  it('works with custom predefinedList', () => {
    const customOrderPair = createOrderPair(['1', '2']);
    expect(customOrderPair('2', '1')).toEqual(['2', '1']);
  });
  it('supports full currying (all three args at once)', () => {
    const result = createOrderPair(
      MAINNET_DATA,
      'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
      'DCC',
    );
    expect(result).toEqual(['DCC', 'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck']);
  });
  it('curried function with partial application returns a function', () => {
    const fn = createOrderPair(MAINNET_DATA);
    expect(typeof fn).toBe('function');
  });
});

describe('TESTNET_DATA', () => {
  const testnetOrderPair = createOrderPair(TESTNET_DATA);

  it('contains DCC', () => {
    expect(TESTNET_DATA).toContain('DCC');
  });
  it('is a non-empty array of strings', () => {
    expect(TESTNET_DATA.length).toBeGreaterThan(0);
    TESTNET_DATA.forEach((id) => expect(typeof id).toBe('string'));
  });
  it('orders [unknown, DCC] with DCC as price asset', () => {
    expect(testnetOrderPair('FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA', 'DCC')).toEqual([
      'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
      'DCC',
    ]);
  });
});

describe('ARBITRARY_DATA', () => {
  const arbitraryOrderPair = createOrderPair(ARBITRARY_DATA);

  it('contains DCC', () => {
    expect(ARBITRARY_DATA).toContain('DCC');
  });
  it('is a non-empty array of strings', () => {
    expect(ARBITRARY_DATA.length).toBeGreaterThan(0);
    ARBITRARY_DATA.forEach((id) => expect(typeof id).toBe('string'));
  });
  it('orders [unknown, DCC] with DCC as price asset', () => {
    expect(arbitraryOrderPair('FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA', 'DCC')).toEqual([
      'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA',
      'DCC',
    ]);
  });
});

describe('compareUint8Arrays', () => {
  it('returns true when first array is lexicographically greater', () => {
    const equalPart = [
      112, 184, 171, 25, 60, 42, 134, 130, 136, 181, 26, 247, 132, 43, 173, 195, 46, 234, 144, 49,
      135, 237, 146, 30, 213, 228, 116, 28, 245,
    ];
    const arr1 = new Uint8Array([222, 55, 176, ...equalPart]);
    const arr2 = new Uint8Array([222, 219, 25, ...equalPart]);
    const arr3 = new Uint8Array([222, 55, 25, ...equalPart]);
    const arr4 = new Uint8Array([222, 55, 176, ...equalPart]);
    expect(compareUint8Arrays(arr1, arr2)).toBe(false);
    expect(compareUint8Arrays(arr1, arr3)).toBe(true);
    expect(compareUint8Arrays(arr1, arr4)).toBe(false); // equal → false
  });
  it('returns false for two empty arrays', () => {
    expect(compareUint8Arrays(new Uint8Array([]), new Uint8Array([]))).toBe(false);
  });
  it('returns true when first is longer and prefix matches', () => {
    expect(compareUint8Arrays(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2]))).toBe(true);
  });
  it('returns false when second is longer and prefix matches', () => {
    expect(compareUint8Arrays(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
  });
  it('handles single-byte arrays', () => {
    expect(compareUint8Arrays(new Uint8Array([255]), new Uint8Array([0]))).toBe(true);
    expect(compareUint8Arrays(new Uint8Array([0]), new Uint8Array([255]))).toBe(false);
  });
});
