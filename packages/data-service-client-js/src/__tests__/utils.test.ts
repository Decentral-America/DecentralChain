import {
  createQS,
  defaultFetch,
  defaultParse,
  hasDangerousKeys,
  isValidLimit,
  isValidSort,
  isValidUrl,
  pipeP,
} from '../utils';

describe('Create querystring util', () => {
  it('works #1', () => {
    const obj = { a: true, b: 1, c: 'string', e: [9, 8, 7] };
    const qs = createQS(obj);
    expect(qs).toBe('?a=true&b=1&c=string&e=9&e=8&e=7');
  });
  it('works with Date (custom serialization)', () => {
    const now = new Date();
    const obj = { a: true, b: 1, c: 'string', d: now, e: [9, 8, 7] };

    const qs = createQS(obj);
    expect(qs).toBe(`?a=true&b=1&c=string&d=${encodeURIComponent(now.toISOString())}&e=9&e=8&e=7`);
  });
  it('ignores undefined fields', () => {
    const obj = { a: true, b: 1, c: 'string', d: undefined, e: [9, 8, 7] };
    const qs = createQS(obj);
    expect(qs).toBe('?a=true&b=1&c=string&e=9&e=8&e=7');
  });
  it('ignores null fields', () => {
    const obj = { a: true, b: null, c: 'string' };
    const qs = createQS(obj);
    expect(qs).toBe('?a=true&c=string');
  });
  it('ignores empty arrays (no malformed ?& prefix)', () => {
    const obj = { ids: [], name: 'test' };
    const qs = createQS(obj);
    expect(qs).toBe('?name=test');
    // Must not produce ?&name=test
    expect(qs).not.toContain('?&');
  });
  it('returns empty string for all-empty input', () => {
    const obj = { ids: [], other: undefined };
    const qs = createQS(obj);
    expect(qs).toBe('');
  });
});

describe('PipeP ', () => {
  const fn = pipeP(
    (a) => [a],
    (b) => [...b, 3],
  );
  it('wraps 2 args in array', async () => {
    const result = await fn(1, 2);
    expect(result).toEqual([[1, 2], 3]);
  });
  it("doesn't wrap 1 arg in array", async () => {
    const result = await fn(1);
    expect(result).toEqual([1, 3]);
  });
});

describe('isValidUrl', () => {
  it('accepts http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
  });
  it('accepts https URLs', () => {
    expect(isValidUrl('https://api.example.com/v1')).toBe(true);
  });
  it('rejects non-http protocols', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('data:text/html,<h1>hi</h1>')).toBe(false);
  });
  it('rejects invalid URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

describe('isValidLimit', () => {
  it('allows undefined and null', () => {
    expect(isValidLimit(undefined)).toBe(true);
    expect(isValidLimit(null)).toBe(true);
  });
  it('allows positive integers within range', () => {
    expect(isValidLimit(1)).toBe(true);
    expect(isValidLimit(100)).toBe(true);
    expect(isValidLimit(10000)).toBe(true);
  });
  it('rejects zero, negative, non-integer, and excessive values', () => {
    expect(isValidLimit(0)).toBe(false);
    expect(isValidLimit(-1)).toBe(false);
    expect(isValidLimit(1.5)).toBe(false);
    expect(isValidLimit(10001)).toBe(false);
    expect(isValidLimit(Infinity)).toBe(false);
    expect(isValidLimit(NaN)).toBe(false);
    expect(isValidLimit('5')).toBe(false);
  });
});

describe('isValidSort', () => {
  it('allows undefined and null', () => {
    expect(isValidSort(undefined)).toBe(true);
    expect(isValidSort(null)).toBe(true);
  });
  it('allows asc and desc', () => {
    expect(isValidSort('asc')).toBe(true);
    expect(isValidSort('desc')).toBe(true);
  });
  it('rejects other values', () => {
    expect(isValidSort('ASC')).toBe(false);
    expect(isValidSort('-some')).toBe(false);
    expect(isValidSort('DROP TABLE')).toBe(false);
    expect(isValidSort(1)).toBe(false);
  });
});

describe('hasDangerousKeys', () => {
  it('detects __proto__', () => {
    expect(hasDangerousKeys(JSON.parse('{"__proto__": {}}'))).toBe(true);
  });
  it('detects constructor', () => {
    expect(hasDangerousKeys({ constructor: {} })).toBe(true);
  });
  it('detects prototype', () => {
    expect(hasDangerousKeys({ prototype: {} })).toBe(true);
  });
  it('passes safe objects', () => {
    expect(hasDangerousKeys({ limit: 5, sender: 'addr' })).toBe(false);
  });
});

describe('defaultParse', () => {
  it('parses valid JSON', () => {
    expect(defaultParse('{"a":1}')).toEqual({ a: 1 });
  });
  it('throws on empty string', () => {
    expect(() => defaultParse('')).toThrow('empty or non-string');
  });
  it('throws on non-string input', () => {
    expect(() => defaultParse(null as any)).toThrow('empty or non-string');
    expect(() => defaultParse(undefined as any)).toThrow('empty or non-string');
  });
  it('throws on invalid JSON with context', () => {
    expect(() => defaultParse('<html>error</html>')).toThrow('invalid JSON');
  });
});

describe('defaultFetch', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns text on successful response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('{"data": "ok"}'),
    });
    const result = await defaultFetch('http://example.com/api');
    expect(result).toBe('{"data": "ok"}');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://example.com/api',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('rejects with HTTP error on non-ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('Resource not found'),
    });
    await expect(defaultFetch('http://example.com/missing')).rejects.toThrow(
      'HTTP 404 Not Found: Resource not found',
    );
  });

  it('rejects with network error on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('DNS resolution failed'));
    await expect(defaultFetch('http://example.com/api')).rejects.toThrow(
      'Network error fetching http://example.com/api: DNS resolution failed',
    );
  });

  it('rejects with timeout error on AbortError', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    globalThis.fetch = vi.fn().mockRejectedValue(abortError);
    await expect(defaultFetch('http://example.com/slow')).rejects.toThrow(
      'Request to http://example.com/slow timed out',
    );
  });

  it('passes request options through to fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('ok'),
    });
    await defaultFetch('http://example.com', { body: '{}', method: 'POST' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://example.com',
      expect.objectContaining({ body: '{}', method: 'POST' }),
    );
  });

  it('truncates long HTTP error bodies to 500 chars', async () => {
    const longBody = 'x'.repeat(1000);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve(longBody),
    });
    await expect(defaultFetch('http://example.com/api')).rejects.toThrow(
      /HTTP 500 Internal Server Error: x{500}$/,
    );
  });
});
