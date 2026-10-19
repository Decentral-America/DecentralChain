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
  const requestFrom = (peer: string | undefined, headers: Record<string, string> = {}) =>
    [
      '/ping',
      { headers },
      peer === undefined ? undefined : { incoming: { socket: { remoteAddress: peer } } },
    ] as const;

  /** Request as Caddy on the same host delivers it: loopback peer, Caddy-written X-Real-IP. */
  const viaCaddy = (clientIp: string, extra: Record<string, string> = {}) =>
    requestFrom('127.0.0.1', { 'X-Real-IP': clientIp, ...extra });

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

  it('a loopback peer is keyed by X-Real-IP, not by X-Forwarded-For', async () => {
    const app = buildRateLimitedApp(2, 60_000);
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      statuses.push(
        (await app.request(...viaCaddy('8.8.8.8', { 'X-Forwarded-For': `6.6.6.${i}` }))).status,
      );
    }
    expect(statuses).toEqual([200, 200, 429, 429]);
  });

  it.each(['127.0.0.2', '::1', '::ffff:127.0.0.1'])('treats %s as loopback', async (peer) => {
    const app = buildRateLimitedApp(1, 60_000);
    expect((await app.request(...requestFrom(peer, { 'X-Real-IP': '4.4.4.4' }))).status).toBe(200);
    expect((await app.request(...requestFrom(peer, { 'X-Real-IP': '4.4.4.4' }))).status).toBe(429);
    expect((await app.request(...requestFrom(peer, { 'X-Real-IP': '4.4.4.5' }))).status).toBe(200);
  });

  it('a loopback peer without a valid X-Real-IP falls back to the last X-Forwarded-For entry', async () => {
    const app = buildRateLimitedApp(2, 60_000);
    for (const realIp of [undefined, 'not-an-ip']) {
      const statuses: number[] = [];
      for (let i = 0; i < 3; i++) {
        statuses.push(
          (
            await app.request(
              ...requestFrom('127.0.0.1', {
                'X-Forwarded-For': `6.6.6.${i}, ${realIp === undefined ? '9.9.9.9' : '9.9.9.8'}`,
                ...(realIp === undefined ? {} : { 'X-Real-IP': realIp }),
              }),
            )
          ).status,
        );
      }
      expect(statuses).toEqual([200, 200, 429]);
    }
  });

  it('a loopback peer with neither header is keyed by the peer itself', async () => {
    const app = buildRateLimitedApp(1, 60_000);
    expect((await app.request(...requestFrom('127.0.0.1'))).status).toBe(200);
    expect((await app.request(...requestFrom('127.0.0.1'))).status).toBe(429);
  });

  it('keys a non-loopback peer by its own address and ignores spoofed headers', async () => {
    const app = buildRateLimitedApp(1, 60_000);
    const direct = (n: string) =>
      app.request(...requestFrom('203.0.113.50', { 'X-Forwarded-For': n, 'X-Real-IP': n }));
    expect((await direct('1.1.1.1')).status).toBe(200);
    expect((await direct('2.2.2.2')).status).toBe(429);
  });

  it('without peer information, ignores forwarding headers', async () => {
    const app = buildRateLimitedApp(1, 60_000);
    const spoof = (n: string) =>
      app.request(...requestFrom(undefined, { 'X-Forwarded-For': n, 'X-Real-IP': n }));
    expect((await spoof('1.1.1.1')).status).toBe(200);
    expect((await spoof('2.2.2.2')).status).toBe(429);
  });
});
