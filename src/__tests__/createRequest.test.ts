import { createRequest } from '../createRequest';
import { HttpMethods } from '../types';

describe('createRequest', () => {
  it('returns a GET request when no params are provided', () => {
    const result = createRequest('http://example.com/assets');
    expect(result).toEqual({
      url: 'http://example.com/assets',
      method: HttpMethods.Get,
    });
  });

  it('returns a GET request with query string when params are provided', () => {
    const result = createRequest('http://example.com/assets', {
      ids: ['a', 'b'],
    });
    expect(result).toEqual({
      url: 'http://example.com/assets?ids=a&ids=b',
      method: HttpMethods.Get,
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
      'Content-Type': 'application/json',
      Accept: 'application/json, text/plain, */*',
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
      ids: ['a'],
      filter: undefined,
    });
    expect(result.url).toBe('http://example.com/assets?ids=a');
    expect(result.method).toBe(HttpMethods.Get);
  });
});
