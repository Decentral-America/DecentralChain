import parse from '../../src/tools/parse';

describe('parse – large-number preservation', () => {
  it('converts 14+ digit integers to strings to prevent precision loss', () => {
    const json = '{"amount":12345678901234567}';
    const result = parse(json) as { amount: string };
    expect(result.amount).toBe('12345678901234567');
    expect(typeof result.amount).toBe('string');
  });

  it('leaves small numbers as numbers', () => {
    const json = '{"fee":100000}';
    const result = parse(json) as { fee: number };
    expect(result.fee).toBe(100000);
    expect(typeof result.fee).toBe('number');
  });

  it('handles negative large integers', () => {
    const json = '{"balance":-99999999999999999}';
    const result = parse(json) as { balance: string };
    expect(result.balance).toBe('-99999999999999999');
  });

  it('handles large decimals with 14+ fractional digits', () => {
    const json = '{"rate":1.12345678901234567}';
    const result = parse(json) as { rate: string };
    expect(result.rate).toBe('1.12345678901234567');
  });

  it('does NOT corrupt values with dots that are not valid numbers', () => {
    // Regression: old regex [\d.]{14,} would match strings of dots
    const json = '{"id":"some-string-value","amount":500}';
    const result = parse(json) as { id: string; amount: number };
    expect(result.id).toBe('some-string-value');
    expect(result.amount).toBe(500);
  });

  it('preserves 13-digit numbers as numbers (below threshold)', () => {
    const json = '{"amount":1234567890123}';
    const result = parse(json) as { amount: number };
    expect(typeof result.amount).toBe('number');
    expect(result.amount).toBe(1234567890123);
  });

  it('handles arrays with mixed large and small values', () => {
    const json = '[{"fee":100000,"amount":99999999999999999}]';
    const result = parse(json) as [{ fee: number; amount: string }];
    expect(result[0].fee).toBe(100000);
    expect(result[0].amount).toBe('99999999999999999');
  });
});
