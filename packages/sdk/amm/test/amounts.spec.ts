import { formatAmount, fromRawAmount, toRawAmount } from '../src/amounts';

describe('toRawAmount', () => {
  it('converts integer amounts', () => {
    expect(toRawAmount('1', 8)).toBe(100000000n);
    expect(toRawAmount('10', 8)).toBe(1000000000n);
    expect(toRawAmount('0', 8)).toBe(0n);
  });

  it('converts decimal amounts', () => {
    expect(toRawAmount('1.5', 8)).toBe(150000000n);
    expect(toRawAmount('0.1', 8)).toBe(10000000n);
    expect(toRawAmount('0.00000001', 8)).toBe(1n);
  });

  it('truncates excess decimals', () => {
    expect(toRawAmount('1.123456789', 8)).toBe(112345678n);
  });

  it('handles zero decimals', () => {
    expect(toRawAmount('100', 0)).toBe(100n);
  });

  it('handles numeric input', () => {
    expect(toRawAmount(1.5, 8)).toBe(150000000n);
  });
});

describe('fromRawAmount', () => {
  it('converts raw to display', () => {
    expect(fromRawAmount(100000000n, 8)).toBe('1');
    expect(fromRawAmount(150000000n, 8)).toBe('1.5');
    expect(fromRawAmount(1n, 8)).toBe('0.00000001');
  });

  it('handles zero', () => {
    expect(fromRawAmount(0n, 8)).toBe('0');
  });

  it('removes trailing zeros', () => {
    expect(fromRawAmount(100000000n, 8)).toBe('1');
    expect(fromRawAmount(110000000n, 8)).toBe('1.1');
  });

  it('handles zero decimals', () => {
    expect(fromRawAmount(100n, 0)).toBe('100');
  });
});

describe('formatAmount', () => {
  it('formats with display decimals', () => {
    expect(formatAmount(123456789n, 8, 4)).toBe('1.2345');
    expect(formatAmount(100000000n, 8, 4)).toBe('1');
  });
});

describe('amount edge cases (AUD-168)', () => {
  it('accepts numbers JavaScript prints in exponent notation', () => {
    expect(toRawAmount(1e-7, 8)).toBe(10n);
    expect(toRawAmount(1.5e-7, 8)).toBe(15n);
    expect(toRawAmount(1e-9, 8)).toBe(0n);
    expect(toRawAmount(1e21, 0)).toBe(1_000_000_000_000_000_000_000n);
    expect(toRawAmount('2.5e-3', 8)).toBe(250_000n);
  });

  it('rejects non-finite numbers', () => {
    expect(() => toRawAmount(Number.NaN, 8)).toThrow(RangeError);
    expect(() => toRawAmount(Number.POSITIVE_INFINITY, 8)).toThrow(RangeError);
  });

  it('keeps the minus sign in front for negative raw amounts', () => {
    expect(fromRawAmount(-5n, 8)).toBe('-0.00000005');
    expect(fromRawAmount(-150_000_000n, 8)).toBe('-1.5');
    expect(fromRawAmount(-100_000_000n, 8)).toBe('-1');
  });

  it('trims trailing zeros in linear time on long inputs', () => {
    const raw = 10n ** 50_000n; // "1" followed by 50,000 zeros
    const started = performance.now();
    expect(fromRawAmount(raw, 50_000)).toBe('1');
    expect(performance.now() - started).toBeLessThan(250);
  });
});
