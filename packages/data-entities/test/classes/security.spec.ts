import { describe, it, expect } from 'vitest';
import { BigNumber } from '@decentralchain/bignumber';
import { getAssetData } from '../assetData';
import { Asset, Money, OrderPrice, AssetPair, Candle, config } from '../../src/index';
import { toBigNumber } from '../../src/utils';

/**
 * Security & Correctness Tests
 *
 * These tests verify hardened behavior for financial-grade use:
 * - NaN / Infinity rejection at the conversion boundary
 * - Division by zero protection
 * - Empty-argument guards on aggregation functions
 * - Consistent identity semantics
 * - Config key injection prevention
 * - Precision edge cases that could cause money to appear or vanish
 */

let fakeEIGHT: Asset;
let fakeFOUR: Asset;
let fakeZERO: Asset;

function setup() {
  fakeEIGHT = new Asset(getAssetData({ id: 'EIGHT', name: 'Eight', precision: 8 }));
  fakeFOUR = new Asset(getAssetData({ id: 'FOUR', name: 'Four', precision: 4 }));
  fakeZERO = new Asset(getAssetData({ id: 'ZERO', name: 'Zero', precision: 0 }));
}

describe('Security: NaN / Infinity rejection', () => {
  it('toBigNumber should throw on non-numeric string', () => {
    expect(() => toBigNumber('abc')).toThrow('Invalid numeric value');
  });

  it('toBigNumber should throw on empty string', () => {
    expect(() => toBigNumber('')).toThrow('Invalid numeric value');
  });

  it('toBigNumber should throw on NaN number', () => {
    expect(() => toBigNumber(NaN)).toThrow('Invalid numeric value');
  });

  it('toBigNumber should throw on Infinity', () => {
    expect(() => toBigNumber(Infinity)).toThrow('Non-finite numeric value');
  });

  it('toBigNumber should throw on negative Infinity', () => {
    expect(() => toBigNumber(-Infinity)).toThrow('Non-finite numeric value');
  });

  it('toBigNumber should throw on NaN BigNumber', () => {
    const nanBn = new BigNumber(NaN);
    expect(() => toBigNumber(nanBn)).toThrow('Invalid numeric value');
  });

  it('toBigNumber should accept valid inputs', () => {
    expect(toBigNumber('0').toFixed(0)).toBe('0');
    expect(toBigNumber(0).toFixed(0)).toBe('0');
    expect(toBigNumber('-1').toFixed(0)).toBe('-1');
    expect(toBigNumber('99999999999999999').toFixed(0)).toBe('99999999999999999');
    expect(toBigNumber(new BigNumber('42')).toFixed(0)).toBe('42');
  });

  it('Money constructor should reject NaN coins', () => {
    setup();
    expect(() => new Money('garbage', fakeEIGHT)).toThrow('Invalid numeric value');
  });

  it('Money.fromTokens should reject NaN input', () => {
    setup();
    expect(() => Money.fromTokens('not-a-number', fakeEIGHT)).toThrow('Invalid numeric value');
  });

  it('Asset constructor should reject NaN quantity', () => {
    expect(() => new Asset(getAssetData({ quantity: 'bad' }))).toThrow('Invalid numeric value');
  });

  it('OrderPrice.fromMatcherCoins should reject NaN', () => {
    setup();
    const pair = new AssetPair(fakeZERO, fakeFOUR);
    expect(() => OrderPrice.fromMatcherCoins('bad', pair)).toThrow('Invalid numeric value');
  });

  it('OrderPrice.fromTokens should reject NaN', () => {
    setup();
    const pair = new AssetPair(fakeZERO, fakeFOUR);
    expect(() => OrderPrice.fromTokens('bad', pair)).toThrow('Invalid numeric value');
  });
});

describe('Security: Division by zero', () => {
  it('Money.div should throw on zero divisor', () => {
    setup();
    const money = Money.fromTokens(10, fakeZERO);
    const zero = Money.fromTokens(0, fakeZERO);
    expect(() => money.div(zero)).toThrow('Division by zero');
  });

  it('Money.div should work with non-zero divisor', () => {
    setup();
    const a = Money.fromTokens(10, fakeZERO);
    const b = Money.fromTokens(2, fakeZERO);
    expect(a.div(b).toFormat()).toBe('5');
  });
});

describe('Security: Empty array guards', () => {
  it('Money.max should throw with no arguments', () => {
    expect(() => Money.max()).toThrow('requires at least one argument');
  });

  it('Money.min should throw with no arguments', () => {
    expect(() => Money.min()).toThrow('requires at least one argument');
  });

  it('Money.max should work with single argument', () => {
    setup();
    const money = Money.fromTokens(5, fakeZERO);
    expect(Money.max(money).eq(money)).toBe(true);
  });

  it('Money.min should work with single argument', () => {
    setup();
    const money = Money.fromTokens(5, fakeZERO);
    expect(Money.min(money).eq(money)).toBe(true);
  });
});

describe('Security: Asset identity consistency', () => {
  it('Money.convert should use ID equality, not reference equality', () => {
    // Two separate Asset instances with the same ID
    const asset1 = new Asset(getAssetData({ id: 'SAME', name: 'Same A', precision: 8 }));
    const asset2 = new Asset(getAssetData({ id: 'SAME', name: 'Same B', precision: 8 }));
    expect(asset1).not.toBe(asset2); // different references
    expect(asset1.id).toBe(asset2.id); // same ID

    const money = Money.fromTokens(10, asset1);
    // Should short-circuit (same ID) — return original reference
    const converted = Money.convert(money, asset2, '1');
    expect(converted).toBe(money);
  });
});

describe('Security: Config key injection', () => {
  it('should reject unknown key in key-value form', () => {
    expect(() => {
      // @ts-expect-error -- testing runtime guard
      config.set('__proto__', () => {});
    }).toThrow('Unknown config key');
  });

  it('should reject unknown key in object form', () => {
    expect(() => {
      // @ts-expect-error -- testing runtime guard
      config.set({ maliciousKey: () => {} });
    }).toThrow('Unknown config key');
  });

  it('should reject constructor pollution attempt', () => {
    expect(() => {
      // @ts-expect-error -- testing runtime guard
      config.set({ constructor: {} });
    }).toThrow('Unknown config key');
  });

  it('should accept valid keys', () => {
    const original = config.get('remapAsset');
    try {
      const fn = (a: Parameters<typeof original>[0]) => a;
      config.set('remapAsset', fn);
      expect(config.get('remapAsset')).toBe(fn);
    } finally {
      config.set('remapAsset', original);
    }
  });
});

describe('Financial precision edge cases', () => {
  it('tokens ↔ coins round-trip should be exact for 8 decimals', () => {
    setup();
    // 1.50000000 tokens = 150000000 coins
    const money = Money.fromTokens('1.50000000', fakeEIGHT);
    expect(money.toCoins()).toBe('150000000');
    expect(money.toTokens()).toBe('1.50000000');
  });

  it('sub-satoshi amounts should round down (floor), not up', () => {
    setup();
    // 0.999999999 with 8 decimals → coins should be 99999999 (floor), not 100000000 (ceil)
    const money = new Money('99999999.9', fakeEIGHT);
    expect(money.toCoins()).toBe('99999999');
  });

  it('negative money should be representable', () => {
    setup();
    const a = Money.fromTokens(5, fakeZERO);
    const b = Money.fromTokens(10, fakeZERO);
    const negative = a.sub(b);
    expect(negative.toCoins()).toBe('-5');
    expect(negative.toTokens()).toBe('-5');
  });

  it('very large token amounts should not lose precision', () => {
    setup();
    // 21 million BTC in satoshis = 2100000000000000
    const money = new Money('2100000000000000', fakeEIGHT);
    expect(money.toCoins()).toBe('2100000000000000');
    expect(money.toTokens()).toBe('21000000.00000000');
  });

  it('conversion with different precisions should maintain precision', () => {
    setup();
    // 10 tokens of precision-8 → convert to precision-4 with rate 2
    // 10 * 10^8 coins = 1000000000 coins
    // result = 1000000000 * 2 / 10^(8-4) = 2000000000 / 10000 = 200000 coins
    // 200000 / 10^4 = 20 tokens
    const money = Money.fromTokens(10, fakeEIGHT);
    const converted = money.convertTo(fakeFOUR, 2);
    expect(converted.toTokens()).toBe('20.0000');
  });

  it('OrderPrice round-trip should be exact', () => {
    setup();
    const pair = new AssetPair(fakeZERO, fakeFOUR);
    const prices = ['0.0001', '1.0000', '999.9999', '0.5000'];
    for (const p of prices) {
      const op = OrderPrice.fromTokens(p, pair);
      const coins = op.toMatcherCoins();
      const restored = OrderPrice.fromMatcherCoins(coins, pair);
      expect(restored.toTokens()).toBe(p);
    }
  });

  it('Money.times produces coin×coin result (documented behavior)', () => {
    setup();
    // For precision 0: 2 coins × 5 coins = 10 coins = 10 tokens ✓
    const a = Money.fromTokens(2, fakeZERO);
    const b = Money.fromTokens(5, fakeZERO);
    expect(a.times(b).toFormat()).toBe('10');

    // For precision 8: 2 tokens × 5 tokens at coin level =
    // 200000000 × 500000000 = 100000000000000000 coins
    // Document: times() operates on COINS, not tokens.
    const c = Money.fromTokens(2, fakeEIGHT);
    const d = Money.fromTokens(5, fakeEIGHT);
    const result = c.times(d);
    expect(result.toCoins()).toBe('100000000000000000');
  });
});

describe('Security: Asset field validation', () => {
  it('should reject empty asset id', () => {
    expect(() => new Asset(getAssetData({ id: '' }))).toThrow('Invalid asset id');
  });

  it('should reject empty asset name', () => {
    expect(() => new Asset(getAssetData({ name: '' }))).toThrow('Invalid asset name');
  });

  it('should reject empty asset sender', () => {
    expect(() => new Asset(getAssetData({ sender: '' }))).toThrow('Invalid asset sender');
  });

  it('should reject negative precision', () => {
    expect(() => new Asset(getAssetData({ precision: -1 }))).toThrow('Invalid precision');
  });

  it('should reject fractional precision', () => {
    expect(() => new Asset(getAssetData({ precision: 2.5 }))).toThrow('Invalid precision');
  });

  it('should reject NaN precision', () => {
    expect(() => new Asset(getAssetData({ precision: NaN }))).toThrow('Invalid precision');
  });

  it('should reject negative height', () => {
    expect(() => new Asset(getAssetData({ height: -1 }))).toThrow('Invalid height');
  });

  it('should reject fractional height', () => {
    expect(() => new Asset(getAssetData({ height: 1.5 }))).toThrow('Invalid height');
  });

  it('should accept precision 0', () => {
    expect(() => new Asset(getAssetData({ precision: 0 }))).not.toThrow();
  });

  it('should accept height 0', () => {
    expect(() => new Asset(getAssetData({ height: 0 }))).not.toThrow();
  });
});

describe('Security: Candle field validation', () => {
  it('should reject negative maxHeight', () => {
    expect(
      () =>
        new Candle({
          time: new Date(),
          open: '1',
          close: '1',
          high: '1',
          low: '1',
          volume: '1',
          quoteVolume: '1',
          weightedAveragePrice: '1',
          maxHeight: -1,
          txsCount: 0,
        }),
    ).toThrow('Invalid maxHeight');
  });

  it('should reject fractional txsCount', () => {
    expect(
      () =>
        new Candle({
          time: new Date(),
          open: '1',
          close: '1',
          high: '1',
          low: '1',
          volume: '1',
          quoteVolume: '1',
          weightedAveragePrice: '1',
          maxHeight: 0,
          txsCount: 1.5,
        }),
    ).toThrow('Invalid txsCount');
  });

  it('should reject NaN maxHeight', () => {
    expect(
      () =>
        new Candle({
          time: new Date(),
          open: '1',
          close: '1',
          high: '1',
          low: '1',
          volume: '1',
          quoteVolume: '1',
          weightedAveragePrice: '1',
          maxHeight: NaN,
          txsCount: 0,
        }),
    ).toThrow('Invalid maxHeight');
  });
});

describe('Security: Money defense-in-depth', () => {
  it('cloneWithTokens should reject NaN input', () => {
    setup();
    const money = Money.fromTokens(1, fakeEIGHT);
    expect(() => money.cloneWithTokens('garbage')).toThrow('Invalid numeric value');
  });

  it('cloneWithCoins should reject NaN input', () => {
    setup();
    const money = Money.fromTokens(1, fakeEIGHT);
    expect(() => money.cloneWithCoins('garbage')).toThrow('Invalid numeric value');
  });

  it('cloneWithCoins should reject Infinity', () => {
    setup();
    const money = Money.fromTokens(1, fakeEIGHT);
    expect(() => money.cloneWithCoins(Infinity)).toThrow('Non-finite numeric value');
  });
});
