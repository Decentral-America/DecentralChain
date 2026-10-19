import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAddresses, fetchSeq } from '../src/api-node/addresses';
import { fetchSeed } from '../src/api-node/utils';

const BASE = 'https://nodes.example.com';
const KEY_HEADERS = { headers: { 'X-API-Key': 'unit-test-key' } };

describe('API-key protected endpoints forward request options', () => {
  const mockFetch = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockImplementation(async () => new Response('[]', { status: 200 }));
  });

  afterEach(() => {
    mockFetch.mockReset();
    vi.unstubAllGlobals();
  });

  const lastCall = () => {
    const [url, init] = mockFetch.mock.calls.at(-1) ?? [];
    return { headers: new Headers(init?.headers), url: String(url) };
  };

  it('addresses.fetchSeq sends the API key header to /addresses/seq', async () => {
    await fetchSeq(BASE, 0, 1, KEY_HEADERS);
    expect(lastCall().url).toContain('/addresses/seq/0/1');
    expect(lastCall().headers.get('x-api-key')).toBe('unit-test-key');
  });

  it('addresses.fetchAddresses sends the API key header to /addresses', async () => {
    await fetchAddresses(BASE, KEY_HEADERS);
    expect(lastCall().headers.get('x-api-key')).toBe('unit-test-key');
  });

  it('utils.fetchSeed sends the API key header to /utils/seed', async () => {
    mockFetch.mockImplementation(async () => new Response('{"seed":"s"}', { status: 200 }));
    await fetchSeed(BASE, 10, KEY_HEADERS);
    expect(lastCall().url).toContain('/utils/seed/10');
    expect(lastCall().headers.get('x-api-key')).toBe('unit-test-key');
  });

  it('sends no API key header when none is given', async () => {
    await fetchSeq(BASE, 0, 1);
    expect(lastCall().headers.get('x-api-key')).toBeNull();
  });
});
