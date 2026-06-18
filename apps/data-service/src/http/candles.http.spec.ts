/**
 * candles.http.spec.ts
 *
 * HTTP-level tests for /v0/candles endpoints.
 * Uses app.request() with mocked services — no real database required.
 */

import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { type ServiceMesh } from '../services';
import { buildApp, mockServices } from '../test/app-factory';

const BASE = '/v0/candles';
const AMOUNT_ASSET = 'DCC';
const PRICE_ASSET = 'USDN';

/** Build a valid candles query string with mandatory params */
function candlesQuery(overrides: Record<string, string> = {}): string {
  const defaults = {
    interval: '1m',
    timeEnd: new Date().toISOString(),
    timeStart: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  };
  const params = new URLSearchParams({ ...defaults, ...overrides });
  return params.toString();
}

describe('GET /v0/candles/:amountAsset/:priceAsset', () => {
  it('returns 404 with message when no candles exist (empty result set)', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}/${AMOUNT_ASSET}/${PRICE_ASSET}?${candlesQuery()}`);
    // candles serialize returns NotFound when items array is empty
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body['message']).toBe('string');
  });

  it('sets Content-Type application/json', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}/${AMOUNT_ASSET}/${PRICE_ASSET}?${candlesQuery()}`);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });

  it('calls search with correct amountAsset and priceAsset', async () => {
    const searchSpy = vi.fn(() => Effect.succeed({ isLastPage: true, items: [] }));
    const services: ServiceMesh = {
      ...mockServices,
      candles: { ...mockServices.candles, search: searchSpy },
    };
    const app = buildApp(services);
    await app.request(`${BASE}/${AMOUNT_ASSET}/${PRICE_ASSET}?${candlesQuery()}`);
    expect(searchSpy).toHaveBeenCalled();
    const callArg = (searchSpy.mock.calls as unknown as unknown[][])[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArg).toMatchObject({
      amountAsset: AMOUNT_ASSET,
      priceAsset: PRICE_ASSET,
    });
  });

  it('returns 400 when timeStart is missing', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}/${AMOUNT_ASSET}/${PRICE_ASSET}?interval=1m`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body['message']).toBe('string');
  });

  it('returns 400 when interval is missing', async () => {
    const app = buildApp();
    const timeStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const res = await app.request(`${BASE}/${AMOUNT_ASSET}/${PRICE_ASSET}?timeStart=${timeStart}`);
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid interval value', async () => {
    const app = buildApp();
    const res = await app.request(
      `${BASE}/${AMOUNT_ASSET}/${PRICE_ASSET}?${candlesQuery({ interval: '99x' })}`,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body['message']).toBe('string');
  });

  it('returns 400 when period exceeds 1440 candles', async () => {
    const app = buildApp();
    // 1-minute interval over 2 days = 2880 candles > 1440 max
    const timeStart = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const timeEnd = new Date().toISOString();
    const res = await app.request(
      `${BASE}/${AMOUNT_ASSET}/${PRICE_ASSET}?timeStart=${timeStart}&timeEnd=${timeEnd}&interval=1m`,
    );
    expect(res.status).toBe(400);
  });

  it('timeStart/timeEnd window is reflected in service call', async () => {
    const searchSpy = vi.fn(() => Effect.succeed({ isLastPage: true, items: [] }));
    const services: ServiceMesh = {
      ...mockServices,
      candles: { ...mockServices.candles, search: searchSpy },
    };
    const app = buildApp(services);
    const timeStart = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min ago
    const timeEnd = new Date().toISOString();
    await app.request(
      `${BASE}/${AMOUNT_ASSET}/${PRICE_ASSET}?timeStart=${timeStart}&timeEnd=${timeEnd}&interval=1m`,
    );
    expect(searchSpy).toHaveBeenCalled();
    const callArg = (searchSpy.mock.calls as unknown as unknown[][])[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArg).toHaveProperty('timeStart');
    expect(callArg).toHaveProperty('timeEnd');
  });
});
