import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Unit tests for the HTTP request module.
 *
 * This module is the backbone of every API call in the library.
 * We mock `fetch` to test behaviour without a running node.
 */

// We need to import dynamically after mocking fetch
let requestFn: <T>(params: { url: string; base: string; options?: RequestInit }) => Promise<T>;

describe('request – HTTP client', () => {
  const mockFetch = vi.fn<typeof fetch>();

  beforeEach(async () => {
    vi.resetModules();
    // Replace global fetch with our mock
    vi.stubGlobal('fetch', mockFetch);
    // Clear module cache so request.ts picks up the mocked fetch
    const mod = await import('../../src/tools/request');
    requestFn = mod.default;
  });

  afterEach(() => {
    mockFetch.mockReset();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('makes a GET request and parses JSON response', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{"height":12345}', { status: 200 }));

    const result = await requestFn<{ height: number }>({
      url: '/blocks/height',
      base: 'https://nodes.example.com',
    });

    expect(result).toEqual({ height: 12345 });
    expect(mockFetch).toHaveBeenCalledOnce();

    // Verify the URL was correctly resolved
    const calledUrl = mockFetch.mock.calls[0]?.[0];
    expect(calledUrl).toBe('https://nodes.example.com/blocks/height');
  });

  it('preserves large numbers as strings (>= 14 digits)', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{"balance":99999999999999999}', { status: 200 }));

    const result = await requestFn<{ balance: string }>({
      url: '/addresses/balance/3L',
      base: 'https://nodes.example.com',
    });

    // parse.ts should have converted the 17-digit number to a string
    expect(result.balance).toBe('99999999999999999');
    expect(typeof result.balance).toBe('string');
  });

  it('rejects with error message from JSON error body', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('{"error":199,"message":"Address not found"}', { status: 404 }),
    );

    await expect(
      requestFn({ url: '/addresses/balance/invalid', base: 'https://nodes.example.com' }),
    ).rejects.toThrow('Address not found');
  });

  it('rejects with HTTP status text when response is not JSON', async () => {
    mockFetch.mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }));

    await expect(
      requestFn({ url: '/blocks/height', base: 'https://nodes.example.com' }),
    ).rejects.toThrow('HTTP 500: Internal Server Error');
  });

  it('attaches timeout signal when none provided', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));

    await requestFn({
      url: '/blocks/height',
      base: 'https://nodes.example.com',
    });

    const calledOptions = mockFetch.mock.calls[0]?.[1] as RequestInit;
    // Should have a timeout signal attached automatically
    expect(calledOptions.signal).toBeDefined();
  });

  it('enforces SSRF protection via resolve() — rejects absolute URL override', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));

    await requestFn({
      url: 'https://evil.com/steal',
      base: 'https://nodes.example.com',
    });

    // The URL passed to fetch should be on nodes.example.com, NOT evil.com
    const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
    const parsedUrl = new URL(calledUrl);
    expect(parsedUrl.hostname).toBe('nodes.example.com');
  });

  it('rejects insecure HTTP for remote hosts (via resolve)', async () => {
    // resolve() throws synchronously for insecure URLs
    // The non-async request function will throw, and await converts to rejection
    try {
      await requestFn({ url: '/blocks/height', base: 'http://remote-node.com' });
      // Should never reach here
      expect.unreachable('Expected request to throw');
    } catch (err: unknown) {
      expect((err as Error).message).toMatch(/Insecure protocol/);
    }

    // fetch should NOT have been called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('allows HTTP for localhost', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{"height":1}', { status: 200 }));

    const result = await requestFn<{ height: number }>({
      url: '/blocks/height',
      base: 'http://localhost:6869',
    });

    expect(result).toEqual({ height: 1 });
  });

  it('handles empty JSON object response', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const result = await requestFn({ url: '/blocks/height', base: 'https://nodes.example.com' });
    expect(result).toEqual({});
  });

  it('handles JSON array response', async () => {
    mockFetch.mockResolvedValueOnce(new Response('[{"id":"abc"},{"id":"def"}]', { status: 200 }));

    const result = await requestFn<{ id: string }[]>({
      url: '/transactions/unconfirmed',
      base: 'https://nodes.example.com',
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'abc' });
  });

  it('includes status and data properties on error', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('{"error":100,"message":"TX not found"}', { status: 400 }),
    );

    try {
      await requestFn({ url: '/transactions/info/bad', base: 'https://nodes.example.com' });
      expect.unreachable('Expected error');
    } catch (err: unknown) {
      const error = err as Error & { data: unknown; status: number };
      expect(error.message).toBe('TX not found');
      expect(error.data).toEqual({ error: 100, message: 'TX not found' });
      expect(error.status).toBe(400);
    }
  });

  it('rejects with stringified payload when error body lacks message field', async () => {
    mockFetch.mockResolvedValueOnce(new Response('{"code":"NOT_FOUND"}', { status: 404 }));

    await expect(
      requestFn({ url: '/blocks/height', base: 'https://nodes.example.com' }),
    ).rejects.toThrow(/HTTP 404/);
  });
});
