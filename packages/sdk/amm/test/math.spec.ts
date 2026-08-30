import { bigMax, bigMin, fraction, isqrt } from '../src/core/math';

describe('isqrt', () => {
  it('returns 0 for 0', () => {
    expect(isqrt(0n)).toBe(0n);
  });

  it('returns 1 for 1', () => {
    expect(isqrt(1n)).toBe(1n);
  });

  it('returns exact roots for perfect squares', () => {
    expect(isqrt(4n)).toBe(2n);
    expect(isqrt(9n)).toBe(3n);
    expect(isqrt(16n)).toBe(4n);
    expect(isqrt(25n)).toBe(5n);
    expect(isqrt(100n)).toBe(10n);
    expect(isqrt(10000n)).toBe(100n);
    expect(isqrt(1000000n)).toBe(1000n);
  });

  it('returns floor for non-perfect squares', () => {
    expect(isqrt(2n)).toBe(1n);
    expect(isqrt(3n)).toBe(1n);
    expect(isqrt(5n)).toBe(2n);
    expect(isqrt(8n)).toBe(2n);
    expect(isqrt(10n)).toBe(3n);
    expect(isqrt(99n)).toBe(9n);
    expect(isqrt(101n)).toBe(10n);
  });

  it('handles large values (10^18)', () => {
    const n = 1000000000000000000n; // 10^18
    expect(isqrt(n)).toBe(1000000000n); // 10^9
  });

  it('handles very large values near RIDE max', () => {
    // sqrt(9.2 * 10^18) ≈ 3.03 * 10^9
    const n = 9200000000000000000n;
    const result = isqrt(n);
    expect(result * result <= n).toBe(true);
    expect((result + 1n) * (result + 1n) > n).toBe(true);
  });

  it('throws on negative input', () => {
    expect(() => isqrt(-1n)).toThrow('negative input');
  });
});

describe('fraction', () => {
  it('computes floor(a * b / c)', () => {
    expect(fraction(10n, 3n, 2n)).toBe(15n); // 30/2
    expect(fraction(7n, 3n, 2n)).toBe(10n); // 21/2 = 10.5 → 10
    expect(fraction(1n, 1n, 3n)).toBe(0n); // 1/3 = 0.33 → 0
  });

  it('handles large multiplicands without overflow', () => {
    const a = 1000000000000000n; // 10^15
    const b = 1000000000000000n;
    const c = 1000000000000000n;
    expect(fraction(a, b, c)).toBe(1000000000000000n);
  });

  it('throws on zero divisor', () => {
    expect(() => fraction(1n, 1n, 0n)).toThrow('divisor must be positive');
  });

  it('throws on negative divisor', () => {
    expect(() => fraction(1n, 1n, -1n)).toThrow('divisor must be positive');
  });

  it('throws on negative inputs', () => {
    expect(() => fraction(-1n, 1n, 1n)).toThrow('non-negative');
    expect(() => fraction(1n, -1n, 1n)).toThrow('non-negative');
  });

  it('returns 0 when a or b is 0', () => {
    expect(fraction(0n, 100n, 1n)).toBe(0n);
    expect(fraction(100n, 0n, 1n)).toBe(0n);
  });
});

describe('bigMin / bigMax', () => {
  it('returns minimum', () => {
    expect(bigMin(1n, 2n)).toBe(1n);
    expect(bigMin(2n, 1n)).toBe(1n);
    expect(bigMin(5n, 5n)).toBe(5n);
  });

  it('returns maximum', () => {
    expect(bigMax(1n, 2n)).toBe(2n);
    expect(bigMax(2n, 1n)).toBe(2n);
    expect(bigMax(5n, 5n)).toBe(5n);
  });
});
