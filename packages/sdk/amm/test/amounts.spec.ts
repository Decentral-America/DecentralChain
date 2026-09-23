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
