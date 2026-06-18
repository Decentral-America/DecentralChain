/**
 * mass-transfer.http.spec.ts
 *
 * HTTP-level tests for /v0/transactions/mass-transfer endpoints.
 * Uses app.request() with mocked services — no real database required.
 */

import { Effect, Option } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { type ServiceMesh } from '../../services';
import { buildApp, mockServices } from '../../test/app-factory';

const BASE = '/v0/transactions/mass-transfer';

describe('GET /v0/transactions/mass-transfer', () => {
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

  it('recipient filter is forwarded to service', async () => {
    const searchSpy = vi.fn(() => Effect.succeed({ isLastPage: true, items: [] }));
    const services: ServiceMesh = {
      ...mockServices,
      transactions: {
        ...mockServices.transactions,
        massTransfer: {
          ...mockServices.transactions.massTransfer,
          search: searchSpy,
        } as any,
      },
    };
    const app = buildApp(services);
    const recipient = '3PK1mLBEg7EPmNGHFqVKbqxujmGKnzT5234';
    const res = await app.request(`${BASE}?recipient=${recipient}`);
    expect(res.status).toBe(200);
    expect(searchSpy).toHaveBeenCalled();
    const callArg = (searchSpy.mock.calls as unknown as unknown[][])[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(callArg).toMatchObject({ recipient });
  });
});

describe('POST /v0/transactions/mass-transfer', () => {
  it('returns 200 for mget by ids', async () => {
    const mgetSpy = vi.fn(() =>
      Effect.succeed([Option.some({ id: 'tx1', timestamp: new Date(), type: 11 })]),
    );
    const services: ServiceMesh = {
      ...mockServices,
      transactions: {
        ...mockServices.transactions,
        massTransfer: {
          ...mockServices.transactions.massTransfer,
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
});

describe('GET /v0/transactions/mass-transfer/:id', () => {
  it('returns 404 when not found', async () => {
    const app = buildApp();
    const res = await app.request(`${BASE}/nonexistent`);
    expect(res.status).toBe(404);
  });

  it('returns 200 when found', async () => {
    const getSpy = vi.fn(() =>
      Effect.succeed(Option.some({ id: 'mt_abc', timestamp: new Date(), type: 11 })),
    );
    const services: ServiceMesh = {
      ...mockServices,
      transactions: {
        ...mockServices.transactions,
        massTransfer: {
          ...mockServices.transactions.massTransfer,
          get: getSpy,
        } as any,
      },
    };
    const app = buildApp(services);
    const res = await app.request(`${BASE}/mt_abc`);
    expect(res.status).toBe(200);
    expect(getSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'mt_abc' }));
  });
});
