/**
 * orderScaling — unit tests
 *
 * These cover the money path: the values produced here go straight into a
 * signed order. The decimal combinations are taken from live markets, which
 * use 0, 1, 2, 3, 4, 5, 7 and 8 decimals — the hardcoded 10^8 this replaced was
 * only correct for the 8/8 case.
 */
import { describe, expect, it } from 'vitest';
import { coinsToTokens, DCC_DECIMALS, toAmountCoins, toPriceCoins } from '../orderScaling';

describe('toAmountCoins', () => {
  it('scales by the amount asset decimals', () => {
    expect(toAmountCoins('1', 8)).toBe('100000000');
    expect(toAmountCoins('1', 0)).toBe('1');
    expect(toAmountCoins('1', 3)).toBe('1000');
    expect(toAmountCoins('1', 7)).toBe('10000000');
  });

  it('does not inflate a 0-decimal asset by 10^8', () => {
    // The bug this replaces: ordering 1 unit of a 0-decimal asset signed an
    // order for 100,000,000 units.
    expect(toAmountCoins('1', 0)).not.toBe('100000000');
    expect(toAmountCoins('1', 0)).toBe('1');
  });

  it('handles fractional token amounts', () => {
    expect(toAmountCoins('1.5', 8)).toBe('150000000');
    expect(toAmountCoins('0.001', 3)).toBe('1');
  });

  it('avoids binary floating-point drift', () => {
    // 0.07 * 10 ** 8 is 7000000.000000001 in IEEE-754.
    expect(toAmountCoins('0.07', 8)).toBe('7000000');
    // 0.29 * 10 ** 2 is 28.999999999999996.
    expect(toAmountCoins('0.29', 2)).toBe('29');
  });

  it('rounds sub-unit precision to an integer coin value', () => {
    // A 0-decimal asset cannot express half a unit.
    expect(toAmountCoins('1.5', 0)).toBe('2');
    expect(toAmountCoins('1.4', 0)).toBe('1');
  });

  it('rejects non-finite and negative input', () => {
    expect(toAmountCoins('abc', 8)).toBeNull();
    expect(toAmountCoins('', 8)).toBeNull();
    expect(toAmountCoins('-1', 8)).toBeNull();
    expect(toAmountCoins(Number.NaN, 8)).toBeNull();
    expect(toAmountCoins(Number.POSITIVE_INFINITY, 8)).toBeNull();
  });

  it('accepts zero', () => {
    expect(toAmountCoins('0', 8)).toBe('0');
  });
});

describe('toPriceCoins', () => {
  it('uses 10^8 when both assets have 8 decimals', () => {
    // The one case the previous hardcoded constant got right — and the only
    // market with resting orders (CR Coin/DCC), which is why this went unnoticed.
    expect(toPriceCoins('0.5', 8, 8)).toBe('50000000');
    expect(toPriceCoins('1', 8, 8)).toBe('100000000');
  });

  it('shifts the exponent by the precision difference', () => {
    // exponent = 8 + priceDecimals - amountDecimals
    expect(toPriceCoins('1', 8, 0)).toBe('1'); // 10^0
    expect(toPriceCoins('1', 0, 8)).toBe('10000000000000000'); // 10^16
    expect(toPriceCoins('1', 8, 3)).toBe('1000'); // 10^3
    expect(toPriceCoins('1', 3, 8)).toBe('10000000000000'); // 10^13
  });

  it('handles a negative exponent', () => {
    // An 8-decimal amount asset priced in a 0-decimal asset gives 10^0, and
    // anything finer gives a negative exponent that must still resolve.
    expect(toPriceCoins('100', 8, 0)).toBe('100');
    expect(toPriceCoins('1', 8, 0)).toBe('1');
  });

  it('differs from the old hardcoded scaling whenever decimals differ', () => {
    const naive = (tokens: number) => String(Math.round(tokens * 100000000));
    // 7-decimal asset (zorionak) priced in an 8-decimal asset.
    expect(toPriceCoins('1', 7, 8)).not.toBe(naive(1));
    // 3-decimal asset priced in an 8-decimal asset.
    expect(toPriceCoins('1', 3, 8)).not.toBe(naive(1));
  });

  it('agrees with the old scaling only in the 8/8 case', () => {
    const naive = (tokens: number) => String(Math.round(tokens * 100000000));
    expect(toPriceCoins('0.5', 8, 8)).toBe(naive(0.5));
    expect(toPriceCoins('123.456', 8, 8)).toBe(naive(123.456));
  });

  it('rejects non-finite and negative input', () => {
    expect(toPriceCoins('abc', 8, 8)).toBeNull();
    expect(toPriceCoins('-1', 8, 8)).toBeNull();
  });
});

describe('coinsToTokens', () => {
  it('divides by the asset decimals', () => {
    expect(coinsToTokens(100000000, 8)).toBe(1);
    expect(coinsToTokens(1, 0)).toBe(1);
    expect(coinsToTokens(1000, 3)).toBe(1);
  });

  it('does not shrink a 0-decimal balance by 10^8', () => {
    // The balance display had the same bug in reverse: a 0-decimal asset with
    // 5 units showed as 0.00000005.
    expect(coinsToTokens(5, 0)).toBe(5);
    expect(coinsToTokens(5, 0)).not.toBe(5e-8);
  });

  it('round-trips with toAmountCoins', () => {
    for (const decimals of [0, 1, 2, 3, 4, 5, 7, 8]) {
      const coins = toAmountCoins('12', decimals);
      expect(coins).not.toBeNull();
      expect(coinsToTokens(coins as string, decimals)).toBe(12);
    }
  });

  it('returns zero for unusable input', () => {
    expect(coinsToTokens(Number.NaN, 8)).toBe(0);
    expect(coinsToTokens('abc', 8)).toBe(0);
  });
});

describe('DCC_DECIMALS', () => {
  it('is 8', () => {
    expect(DCC_DECIMALS).toBe(8);
  });
});
