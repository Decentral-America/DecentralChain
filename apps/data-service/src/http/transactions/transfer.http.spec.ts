/**
 * transfer.http.spec.ts
 *
 * HTTP-level tests for /v0/transactions/transfer endpoints.
 * Uses app.request() with mocked services — no real database required.
 */

import { Effect, Option } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { type ServiceMesh } from '../../services';
import { buildApp, mockServices } from '../../test/app-factory';

const BASE = '/v0/transactions/transfer';

describe('GET /v0/transactions/transfer', () => {
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

  it('sender filter is forwarded to service (search called)', async () => {
    const searchSpy = vi.fn(() => Effect.succeed({ isLastPage: true, items: [] }));
    const services: ServiceMesh = {
      ...mockServices,
      transactions: {
        ...mockServices.transactions,
        transfer: {
          ...mockServices.transactions.transfer,
          search: searchSpy,
        } as any,
      },
    };
    const app = buildApp(services);
    const res = await app.request(`${BASE}?sender=3P1234`);
    expect(res.status).toBe(200);
    expect(searchSpy).toHaveBeenCalled();
    const callArg = (searchSpy.mock.calls as unknown as unknown[][])[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArg).toMatchObject({ sender: '3P1234' });
  });

  it('limit=1 is accepted and passed to service', async () => {
    const searchSpy = vi.fn(() => Effect.succeed({ isLastPage: true, items: [] }));
    const services: ServiceMesh = {
      ...mockServices,
      transactions: {
        ...mockServices.transactions,
        transfer: {
          ...mockServices.transactions.transfer,
          search: searchSpy,
        } as any,
      },
    };
    const app = buildApp(services);
    const res = await app.request(`${BASE}?limit=1`);
    expect(res.status).toBe(200);
    expect(searchSpy).toHaveBeenCalled();
    const callArg = (searchSpy.mock.calls as unknown as unknown[][])[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArg).toMatchObject({ limit: 1 });
  });
});

describe('POST /v0/transactions/transfer', () => {
  it('returns 200 with array shape for mget by ids', async () => {
    const mgetSpy = vi.fn(() =>
      Effect.succeed([Option.some({ id: 'tx1', timestamp: new Date(), type: 4 })]),
    );
    const services: ServiceMesh = {
      ...mockServices,
      transactions: {
        ...mockServices.transactions,
        transfer: {
          ...mockServices.transactions.transfer,
          mget: mgetSpy,
        } as any,
      },
    };
    const app = buildApp(services);
    const res = await app.request(BASE, {
      body: JSON.stringify({ ids: ['tx1', 'tx2'] }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(res.status).toBe(200);
    expect(mgetSpy).toHaveBeenCalled();
    const body = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(body['data'])).toBe(true);
  });

  it('empty body is treated as search with defaults', async () => {
    const searchSpy = vi.fn(() => Effect.succeed({ isLastPage: true, items: [] }));
    const services: ServiceMesh = {
      ...mockServices,
      transactions: {
        ...mockServices.transactions,
        transfer: {
          ...mockServices.transactions.transfer,
          search: searchSpy,
        } as any,
      },
    };
    const app = buildApp(services);
    const res = await app.request(BASE, {
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    expect(res.status).toBe(200);
  });
});

describe('GET /v0/transactions/transfer/:id', () => {
  it('returns 200 with transaction when found', async () => {
    const getSpy = vi.fn(() =>
      Effect.succeed(Option.some({ id: 'tx_abc', timestamp: new Date(), type: 4 })),
    );
    const services: ServiceMesh = {
      ...mockServices,
      transactions: {
        ...mockServices.transactions,
        transfer: {
          ...mockServices.transactions.transfer,
          get: getSpy,
        } as any,
      },
    };
    const app = buildApp(services);
    const res = await app.request(`${BASE}/tx_abc`);
    expect(res.status).toBe(200);
    expect(getSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'tx_abc' }));
  });

  it('returns 404 when transaction not found', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}/nonexistent_tx`);
    expect(res.status).toBe(404);
  });
});
