/**
 * middleware.http.spec.ts
 *
 * HTTP-level tests for cross-cutting middleware applied to every response:
 * CORS headers, X-Request-Id, secure headers, and rate limiting.
 */

import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { type AppEnv } from '../http/_common/types';
import injectEventBus from '../middleware/injectEventBus';
import { createRateLimiter } from '../middleware/rateLimiter';
import { buildApp, noopEventBus } from '../test/app-factory';

describe('CORS headers', () => {
  it('sets Access-Control-Allow-Origin: * on /health', async () => {
    const app = buildApp();
    const res = await app.request('/health', {
      headers: { Origin: 'https://dapp.example.com' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('sets Access-Control-Allow-Origin: * on /v0/pairs', async () => {
    const app = buildApp();
    const res = await app.request('/v0/pairs', {
      headers: { Origin: 'https://dapp.example.com' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('responds to OPTIONS preflight with 204/200 and CORS headers', async () => {
    const app = buildApp();
    const res = await app.request('/v0/pairs', {
      headers: {
        'Access-Control-Request-Method': 'GET',
        Origin: 'https://dapp.example.com',
      },
      method: 'OPTIONS',
    });
    // Hono cors middleware returns 204 for preflight
    expect([200, 204]).toContain(res.status);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});

describe('Request-ID header', () => {
  it('sets X-Request-Id on responses', async () => {
    const app = buildApp();
    const res = await app.request('/health');
    // hono/request-id sets X-Request-Id by default
    const requestIdHeader = res.headers.get('x-request-id');
    expect(requestIdHeader).toBeTruthy();
    expect(typeof requestIdHeader).toBe('string');
  });

  it('propagates client-supplied X-Request-Id', async () => {
    const app = buildApp();
    const myId = 'test-request-id-42';
    const res = await app.request('/health', {
      headers: { 'X-Request-Id': myId },
    });
    expect(res.headers.get('x-request-id')).toBe(myId);
  });
});

describe('Secure headers', () => {
  it('sets X-Frame-Options on responses', async () => {
    const app = buildApp();
    const res = await app.request('/health');
    expect(res.headers.get('x-frame-options')).toBeTruthy();
  });

  it('sets X-Content-Type-Options: nosniff', async () => {
    const app = buildApp();
    const res = await app.request('/health');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('Rate limiter', () => {
  /** Request as Caddy on the same host delivers it: loopback peer, Caddy-written last XFF entry. */
  const viaCaddy = (clientIp: string, extra: Record<string, string> = {}) =>
    [
      '/ping',
      { headers: { 'X-Forwarded-For': clientIp, ...extra } },
      { incoming: { socket: { remoteAddress: '127.0.0.1' } } },
    ] as const;

  function buildRateLimitedApp(max: number, windowMs: number) {
    const app = new Hono<AppEnv>();
    app.use(injectEventBus(noopEventBus));
    app.use(createRateLimiter({ max, windowMs }));
    app.get('/ping', (c) => c.json({ ok: true }));
    return app;
  }

  it('allows requests under the limit', async () => {
    const app = buildRateLimitedApp(5, 60_000);
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => app.request(...viaCaddy('1.2.3.4'))),
    );
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
  });

  it('returns 429 with Retry-After when the limit is exceeded for the same client', async () => {
    const app = buildRateLimitedApp(3, 60_000);
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      statuses.push((await app.request(...viaCaddy('10.0.0.99'))).status);
    }
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
    const res = await app.request(...viaCaddy('10.0.0.99'));
    expect(res.headers.get('retry-after')).toBeTruthy();
  });

  it('different clients have independent windows', async () => {
    const app = buildRateLimitedApp(1, 60_000);
    expect((await app.request(...viaCaddy('192.168.1.1'))).status).toBe(200);
    expect((await app.request(...viaCaddy('192.168.1.2'))).status).toBe(200);
  });

  it('ignores client-supplied X-Real-IP and leading X-Forwarded-For entries', async () => {
    const app = buildRateLimitedApp(2, 60_000);
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      // Spoofed values change on every request; the Caddy-written last entry does not.
      statuses.push(
        (await app.request(...viaCaddy(`6.6.6.${i}, 9.9.9.9`, { 'X-Real-IP': `7.7.7.${i}` })))
          .status,
      );
    }
    expect(statuses).toEqual([200, 200, 429, 429]);
  });

  it('keys a non-loopback peer by its own address and ignores its headers', async () => {
    const app = buildRateLimitedApp(1, 60_000);
    const direct = (xff: string) =>
      app.request(
        '/ping',
        { headers: { 'X-Forwarded-For': xff } },
        { incoming: { socket: { remoteAddress: '203.0.113.50' } } },
      );
    expect((await direct('1.1.1.1')).status).toBe(200);
    expect((await direct('2.2.2.2')).status).toBe(429);
  });
});
