/**
 * aliases.http.spec.ts
 *
 * HTTP-level tests for /v0/aliases endpoints.
 * Uses app.request() with mocked services — no real database required.
 */

import { Effect, Option } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { type ServiceMesh } from '../services';
import { buildApp, mockServices } from '../test/app-factory';

const BASE = '/v0/aliases';

describe('GET /v0/aliases/:alias', () => {
  it('returns 404 when alias not found', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}/alias:some-alias`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body['message']).toBe('string');
  });

  it('returns 200 with alias data when found', async () => {
    const fakeAlias = { address: '3P1234', alias: 'some-alias' };
    const getSpy = vi.fn(() => Effect.succeed(Option.some(fakeAlias)));
    const services: ServiceMesh = {
      ...mockServices,
      aliases: { ...mockServices.aliases, get: getSpy },
    };
    const app = buildApp(services);
    const res = await app.request(`${BASE}/alias:some-alias`);
    expect(res.status).toBe(200);
    expect(getSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'alias:some-alias' }));
  });

  it('sets Content-Type application/json', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}/alias:some-alias`);
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });
});

describe('GET /v0/aliases?address=X', () => {
  it('calls search service with address filter', async () => {
    const searchSpy = vi.fn(() => Effect.succeed({ isLastPage: true, items: [] }));
    const services: ServiceMesh = {
      ...mockServices,
      aliases: { ...mockServices.aliases, search: searchSpy },
    };
    const app = buildApp(services);
    const address = '3P1234';
    const res = await app.request(`${BASE}?address=${address}`);
    expect(res.status).toBe(200);
    expect(searchSpy).toHaveBeenCalled();
    const callArg = (searchSpy.mock.calls as unknown as unknown[][])[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArg).toMatchObject({ address });
  });

  it('returns 200 with empty data array when no aliases found', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}?address=3PNoAliasAddress`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body['data'])).toBe(true);
  });

  it('returns 400 when neither address nor aliases is provided', async () => {
    const app = buildApp();
    // No useful query params — aliases parse will fail
    const res = await app.request(`${BASE}?limit=10`);
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body['message']).toBe('string');
  });

  it('returns 400 when address is empty string', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}?address=`);
    expect(res.status).toBe(400);
  });
});

describe('POST /v0/aliases', () => {
  it('returns 200 for mget by aliases array', async () => {
    const mgetSpy = vi.fn(() => Effect.succeed([Option.none(), Option.none()]));
    const services: ServiceMesh = {
      ...mockServices,
      aliases: { ...mockServices.aliases, mget: mgetSpy },
    };
    const app = buildApp(services);
    const res = await app.request(BASE, {
      body: JSON.stringify({ aliases: ['alias:first', 'alias:second'] }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(res.status).toBe(200);
    expect(mgetSpy).toHaveBeenCalled();
    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body['data'])).toBe(true);
  });
});
