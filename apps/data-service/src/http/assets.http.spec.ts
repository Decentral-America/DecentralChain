/**
 * assets.http.spec.ts
 *
 * HTTP-level tests for /v0/assets endpoints.
 * Uses app.request() with mocked services — no real database required.
 */

import { Effect, Option } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { type ServiceMesh } from '../services';
import { buildApp, mockServices } from '../test/app-factory';
import { AssetInfo } from '../types';

const BASE = '/v0/assets';

/** Minimal AssetInfo fixture for tests */
const fakeAsset = new AssetInfo({
  description: '',
  hasScript: false,
  height: 1,
  id: 'DCC',
  issue: {},
  minSponsoredFee: null,
  name: 'DCC',
  precision: 8,
  quantity: BigInt(1000000000),
  reissuable: false,
  sender: '3P1234',
  ticker: null,
  timestamp: new Date(),
} as any);

describe('GET /v0/assets/:id', () => {
  it('returns 200 with asset when found', async () => {
    const getSpy = vi.fn(() => Effect.succeed(Option.some(fakeAsset)));
    const services: ServiceMesh = {
      ...mockServices,
      assets: { ...mockServices.assets, get: getSpy },
    };
    const app = buildApp(services);
    const res = await app.request(`${BASE}/DCC`);
    expect(res.status).toBe(200);
    expect(getSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'DCC' }));
  });

  it('returns 404 when asset not found', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}/UNKNOWN_ASSET`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body['message']).toBe('string');
  });

  it('sets Content-Type application/json', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}/DCC`);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });
});

describe('POST /v0/assets', () => {
  it('returns 200 with array for mget by ids', async () => {
    const mgetSpy = vi.fn(() => Effect.succeed([Option.some(fakeAsset), Option.none()]));
    const services: ServiceMesh = {
      ...mockServices,
      assets: { ...mockServices.assets, mget: mgetSpy },
    };
    const app = buildApp(services);
    const res = await app.request(BASE, {
      body: JSON.stringify({ ids: ['DCC', 'UNKNOWN'] }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(res.status).toBe(200);
    expect(mgetSpy).toHaveBeenCalled();
    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body['data'])).toBe(true);
  });

  it('returns 400 when ids array is empty (treated as missing search param)', async () => {
    const app = buildApp();
    const res = await app.request(BASE, {
      body: JSON.stringify({ ids: [] }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    // Empty ids array serialises to no ids in query string → parse falls through
    // to search path which requires ticker or search → 400
    expect(res.status).toBe(400);
  });
});

describe('GET /v0/assets?search=X', () => {
  it('calls search service with search term', async () => {
    const searchSpy = vi.fn(() => Effect.succeed({ isLastPage: true, items: [] }));
    const services: ServiceMesh = {
      ...mockServices,
      assets: { ...mockServices.assets, search: searchSpy },
    };
    const app = buildApp(services);
    const res = await app.request(`${BASE}?search=DCC`);
    expect(res.status).toBe(200);
    expect(searchSpy).toHaveBeenCalled();
    const callArg = (searchSpy.mock.calls as unknown as unknown[][])[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArg).toMatchObject({ search: 'DCC' });
  });

  it('returns 400 when neither ticker nor search is provided', async () => {
    const app = buildApp();
    // GET /assets with no useful query param — parse fails
    const res = await app.request(`${BASE}?limit=10`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body['message']).toBe('string');
  });
});
