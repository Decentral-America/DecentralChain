import query from '../../src/tools/query';

describe('query – URL encoding & injection prevention', () => {
  it('builds basic query string', () => {
    expect(query({ limit: 10 })).toBe('?limit=10');
  });

  it('returns empty string for no params', () => {
    expect(query({})).toBe('');
  });

  it('filters out null/undefined values', () => {
    expect(query({ a: 1, b: null, c: undefined })).toBe('?a=1');
  });

  it('encodes special characters to prevent query injection', () => {
    const result = query({ search: 'a&b=c' });
    expect(result).toBe('?search=a%26b%3Dc');
    // Verify it does NOT contain unescaped & or =
    expect(result.match(/&/g)?.length ?? 0).toBe(0);
  });

  it('encodes keys with special characters', () => {
    const result = query({ 'foo bar': 'value' });
    expect(result).toBe('?foo%20bar=value');
  });

  it('handles array values', () => {
    const result = query({ id: ['abc', 'def'] });
    expect(result).toBe('?id=abc&id=def');
  });

  it('encodes hash characters to prevent fragment injection', () => {
    const result = query({ after: 'tx#fragment' });
    expect(result).toContain('tx%23fragment');
  });
});
