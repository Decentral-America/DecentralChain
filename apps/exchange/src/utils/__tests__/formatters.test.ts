/**
 * Unit tests: src/utils/formatters.ts
 *
 * All functions are pure — no mocks required.
 */
import { describe, expect, it } from 'vitest';
import {
  formatAmount,
  formatDcc,
  shortenAddress,
  stringifyJSON,
  toTimestamp,
} from '@/utils/formatters';

// ─── stringifyJSON ────────────────────────────────────────────────────────────

describe('stringifyJSON', () => {
  it('serialises a plain object', () => {
    expect(stringifyJSON({ a: 1, b: 'x' })).toBe('{"a":1,"b":"x"}');
  });

  it('calls toFixed() on BigNumber-like values', () => {
    const bn = { toFixed: () => '3.14159' };
    expect(stringifyJSON({ price: bn })).toBe('{"price":"3.14159"}');
  });

  it('delegates to a custom replacer for non-BigNumber values', () => {
    const replacer = (_key: string, value: unknown) =>
      typeof value === 'number' ? value * 10 : value;
    expect(stringifyJSON({ n: 5 }, replacer)).toBe('{"n":50}');
  });

  it('BigNumber takes precedence over custom replacer', () => {
    const bn = { toFixed: () => '99' };
    const replacer = (_key: string, value: unknown) =>
      typeof value === 'string' ? 'replaced' : value;
    // toFixed path fires before the replacer branch
    expect(stringifyJSON({ x: bn }, replacer)).toBe('{"x":"99"}');
  });

  it('respects the space argument', () => {
    const out = stringifyJSON({ a: 1 }, null, 2);
    expect(out).toBe('{\n  "a": 1\n}');
  });

  it('handles null data', () => {
    expect(stringifyJSON(null)).toBe('null');
  });

  it('handles an array', () => {
    expect(stringifyJSON([1, 2, 3])).toBe('[1,2,3]');
  });
});

// ─── formatDcc ────────────────────────────────────────────────────────────────

describe('formatDcc', () => {
  it('formats an integer with default 8 decimals (no trailing zeros)', () => {
    expect(formatDcc(1)).toBe('1');
  });

  it('formats a decimal value up to 8 places', () => {
    expect(formatDcc(1.12345678)).toBe('1.12345678');
  });

  it('formats zero', () => {
    expect(formatDcc(0)).toBe('0');
  });

  it('adds thousands separators', () => {
    expect(formatDcc(1_000_000)).toBe('1,000,000');
  });

  it('respects a custom decimals parameter', () => {
    expect(formatDcc(3.14159, 2)).toBe('3.14');
  });
});

// ─── formatAmount ─────────────────────────────────────────────────────────────

describe('formatAmount', () => {
  it('formats an integer with default maximumFractionDigits 8', () => {
    expect(formatAmount(42)).toBe('42');
  });

  it('formats a float', () => {
    expect(formatAmount(0.001)).toBe('0.001');
  });

  it('adds thousands separators', () => {
    expect(formatAmount(2_500_000)).toBe('2,500,000');
  });

  it('respects a custom maximumFractionDigits', () => {
    expect(formatAmount(1.987654, 3)).toBe('1.988');
  });

  it('formats zero', () => {
    expect(formatAmount(0)).toBe('0');
  });
});

// ─── shortenAddress ───────────────────────────────────────────────────────────

describe('shortenAddress', () => {
  it('returns short addresses unchanged', () => {
    // 6 chars — well within limit
    expect(shortenAddress('3PDxxx')).toBe('3PDxxx');
    // 12 chars — exactly at the <= 12 boundary
    expect(shortenAddress('123456789012')).toBe('123456789012');
  });

  it('shortens a 35-char address to first 6 + ellipsis + last 4', () => {
    // '3PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqK' = 35 chars
    // slice(0,6) = '3PJCkx', slice(-4) = 'KvqK'
    const addr = '3PJCkxKEMgnCSSFZzrpTNa7XEt5hEDoKvqK';
    expect(shortenAddress(addr)).toBe('3PJCkx\u2026KvqK');
  });

  it('returns an empty string unchanged', () => {
    expect(shortenAddress('')).toBe('');
  });
});

// ─── toTimestamp ──────────────────────────────────────────────────────────────

describe('toTimestamp', () => {
  it('returns the millisecond value from a Date instance', () => {
    const d = new Date('2026-01-01T00:00:00.000Z');
    expect(toTimestamp(d)).toBe(d.getTime());
  });

  it('parses an ISO string to milliseconds', () => {
    const iso = '2026-05-19T12:00:00.000Z';
    expect(toTimestamp(iso)).toBe(new Date(iso).getTime());
  });

  it('returns a numeric timestamp unchanged', () => {
    expect(toTimestamp(1_716_105_600_000)).toBe(1_716_105_600_000);
  });

  it('handles a zero timestamp', () => {
    expect(toTimestamp(0)).toBe(0);
  });
});
