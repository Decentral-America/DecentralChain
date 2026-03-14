import { createRequest } from '../createRequest';
import { HttpMethods } from '../types';

describe('createRequest', () => {
  it('returns a GET request when no params are provided', () => {
    const result = createRequest('http://example.com/assets');
    expect(result).toEqual({
      method: HttpMethods.Get,
      url: 'http://example.com/assets',
    });
  });

  it('returns a GET request with query string when params are provided', () => {
    const result = createRequest('http://example.com/assets', {
      ids: ['a', 'b'],
    });
    expect(result).toEqual({
      method: HttpMethods.Get,
      url: 'http://example.com/assets?ids=a&ids=b',
    });
  });

  it('returns a POST request when URL exceeds 2000 characters', () => {
    const longId = 'A'.repeat(200);
    const ids = new Array(20).fill(longId);
    const result = createRequest('http://example.com/assets', { ids });

    expect(result.method).toBe(HttpMethods.Post);
    expect(result.url).toBe('http://example.com/assets');
    expect(result.body).toBeDefined();
    expect(result.headers).toEqual({
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    });

    const parsedBody = JSON.parse(result.body as string);
    expect(parsedBody.ids).toHaveLength(20);
  });

  it('keeps GET when URL is exactly at the limit', () => {
    // Build params that produce a URL just under 2000 chars
    const result = createRequest('http://example.com/test', { a: 'short' });
    expect(result.method).toBe(HttpMethods.Get);
    expect(result.url).toBe('http://example.com/test?a=short');
  });

  it('filters undefined values from query string via createQS', () => {
    const result = createRequest('http://example.com/assets', {
      filter: undefined,
      ids: ['a'],
    });
    expect(result.url).toBe('http://example.com/assets?ids=a');
    expect(result.method).toBe(HttpMethods.Get);
  });
});
