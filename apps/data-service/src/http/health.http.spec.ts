/**
 * health.http.spec.ts
 *
 * HTTP-level tests for /health, /readiness, and /version endpoints.
 * Uses app.request() — no real server or database required.
 */

import { describe, expect, it } from 'vitest';
import { buildApp, failingPgDriver, mockPgDriver } from '../test/app-factory';

describe('GET /health', () => {
  it('returns 200', async () => {
    const app = buildApp();
    const res = await app.request('/health');
    expect(res.status).toBe(200);
  });

  it('returns JSON with status ok', async () => {
    const app = buildApp();
    const res = await app.request('/health');
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: 'ok' });
  });

  it('sets Content-Type application/json', async () => {
    const app = buildApp();
    const res = await app.request('/health');
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });

  it('is also reachable at /v0/health', async () => {
    const app = buildApp();
    const res = await app.request('/v0/health');
    expect(res.status).toBe(200);
  });
});

describe('GET /readiness', () => {
  it('returns 200 when DB is reachable', async () => {
    const app = buildApp(undefined, mockPgDriver);
    const res = await app.request('/readiness');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: 'ready' });
  });

  it('returns 503 when DB is unavailable', async () => {
    const app = buildApp(undefined, failingPgDriver);
    const res = await app.request('/readiness');
    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ status: 'unavailable' });
  });

  it('always sets Content-Type application/json', async () => {
    const app = buildApp(undefined, failingPgDriver);
    const res = await app.request('/readiness');
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
  });
});

describe('GET /version', () => {
  it('returns 200', async () => {
    const app = buildApp();
    const res = await app.request('/version');
    expect(res.status).toBe(200);
  });

  it('returns JSON with a version string', async () => {
    const app = buildApp();
    const res = await app.request('/version');
    const body = (await res.json()) as Record<string, unknown>;
    expect(typeof body['version']).toBe('string');
    expect((body['version'] as string).length).toBeGreaterThan(0);
  });
});
