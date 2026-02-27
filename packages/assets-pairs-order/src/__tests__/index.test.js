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
  it('is callable without arguments', () => {
    expect(() => orderPair()).not.toThrow();
  });
  it('has both default and named exports', () => {
    expect(createOrderPair).toBeDefined();
    expect(MAINNET_DATA).toBeDefined();
    expect(TESTNET_DATA).toBeDefined();
    expect(ARBITRARY_DATA).toBeDefined();
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
});

describe('TESTNET_DATA', () => {
  const testnetOrderPair = createOrderPair(TESTNET_DATA);

  it('contains DCC', () => {
    expect(TESTNET_DATA).toContain('DCC');
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
    const arr1 = new Uint32Array([222, 55, 176, ...equalPart]);
    const arr2 = new Uint32Array([222, 219, 25, ...equalPart]);
    const arr3 = new Uint32Array([222, 55, 25, ...equalPart]);
    const arr4 = new Uint32Array([222, 55, 176, ...equalPart]);
    expect(compareUint8Arrays(arr1, arr2)).toBe(true);
    expect(compareUint8Arrays(arr1, arr3)).toBe(false);
    expect(compareUint8Arrays(arr1, arr4)).toBe(false); // equal → false
  });
});
