import { describe, expect, it } from 'vitest';
import { DEFAULT_STATEMENT_TIMEOUT_MS, parseStatementTimeout } from './loadConfig';

describe('PGSTATEMENTTIMEOUT', () => {
  it('defaults to 25 s when unset so a slow query cannot hold a pool connection forever', () => {
    expect(DEFAULT_STATEMENT_TIMEOUT_MS).toBe(25_000);
    expect(parseStatementTimeout(undefined)).toBe(25_000);
    expect(parseStatementTimeout('')).toBe(25_000);
  });
  it('accepts an explicit value and 0/false to disable', () => {
    expect(parseStatementTimeout('15000')).toBe(15_000);
    expect(parseStatementTimeout('0')).toBe(false);
    expect(parseStatementTimeout('false')).toBe(false);
  });
  it('rejects garbage instead of silently disabling the timeout', () => {
    expect(() => parseStatementTimeout('abc')).toThrow('PGSTATEMENTTIMEOUT=abc');
    expect(() => parseStatementTimeout('-5')).toThrow('PGSTATEMENTTIMEOUT=-5');
  });
});
