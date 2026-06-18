/**
 * pairs.http.spec.ts
 *
 * HTTP-level tests for /v0/pairs endpoints.
 * Uses app.request() with mocked services — no real database required.
 */

import { Effect, Option } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { type ServiceMesh } from '../services';
import { buildApp, mockServices } from '../test/app-factory';

const BASE = '/v0/pairs';

describe('GET /v0/pairs', () => {
  it('returns 200 with array shape', async () => {
    const app = buildApp();
    const res = await app.request(BASE);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body['data'])).toBe(true);
  });

  it('sets Content-Type application/json', async () => {
    const app = buildApp();
    const res = await app.request(BASE);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });

  it('calls search service when no pairs param given', async () => {
    const searchSpy = vi.fn(() => Effect.succeed({ isLastPage: true, items: [] }));
    const services: ServiceMesh = {
      ...mockServices,
      pairs: { ...mockServices.pairs, search: searchSpy },
    };
    const app = buildApp(services);
    await app.request(BASE);
    expect(searchSpy).toHaveBeenCalled();
  });
});

describe('GET /v0/pairs/:amountAsset/:priceAsset', () => {
  it('returns 404 when pair not found', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}/DCC/USDN`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body['message']).toBe('string');
  });

  it('returns 200 with pair data when found', async () => {
    const fakePair = {
      amountAsset: 'DCC',
      firstPrice: { toString: () => '1.0' },
      high: { toString: () => '1.1' },
      lastPrice: { toString: () => '1.0' },
      low: { toString: () => '0.9' },
      priceAsset: 'USDN',
      quoteVolume: { toString: () => '1000' },
      txsCount: 5,
      volume: { toString: () => '1000' },
      volumeDcc: null,
      weightedAveragePrice: { toString: () => '1.0' },
    };
    const getSpy = vi.fn(() => Effect.succeed(Option.some(fakePair as any)));
    const services: ServiceMesh = {
      ...mockServices,
      pairs: { ...mockServices.pairs, get: getSpy },
    };
    const app = buildApp(services);
    const res = await app.request(`${BASE}/DCC/USDN`);
    expect(res.status).toBe(200);
    expect(getSpy).toHaveBeenCalled();
  });

  it('sets Content-Type application/json', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}/DCC/USDN`);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });
});

describe('POST /v0/pairs', () => {
  it('returns 200 for mget by pairs using slash-separated strings', async () => {
    const mgetSpy = vi.fn(() => Effect.succeed([Option.none(), Option.none()]));
    const services: ServiceMesh = {
      ...mockServices,
      pairs: { ...mockServices.pairs, mget: mgetSpy },
    };
    const app = buildApp(services);
    const res = await app.request(BASE, {
      // pairs mget requires string pairs in 'amountAsset/priceAsset' format and matcher
      body: JSON.stringify({
        matcher: '3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr',
        pairs: ['DCC/USDN', 'DCC/BTC'],
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(res.status).toBe(200);
    expect(mgetSpy).toHaveBeenCalled();
    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body['data'])).toBe(true);
  });
});
