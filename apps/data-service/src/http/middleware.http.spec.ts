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
  /**
   * Build a minimal Hono app with just the rate limiter and a test route.
   * We set a very low limit (max=2) and a short window so tests run fast.
   */
  function buildRateLimitedApp(max: number, windowMs: number) {
    const app = new Hono<AppEnv>();
    app.use(injectEventBus(noopEventBus));
    app.use(createRateLimiter({ max, windowMs }));
    app.get('/ping', (c) => c.json({ ok: true }));
    return app;
  }

  it('allows requests under the limit', async () => {
    const app = buildRateLimitedApp(5, 60_000);
    const requests = Array.from({ length: 5 }, () =>
      app.request('/ping', { headers: { 'X-Real-IP': '1.2.3.4' } }),
    );
    const responses = await Promise.all(requests);
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
  });

  it('returns 429 when limit is exceeded for the same IP', async () => {
    const app = buildRateLimitedApp(3, 60_000);
    const ip = '10.0.0.99';
    const results: number[] = [];
    // Send 5 sequential requests — first 3 should pass, 4th and 5th should 429
    for (let i = 0; i < 5; i++) {
      const res = await app.request('/ping', { headers: { 'X-Real-IP': ip } });
      results.push(res.status);
    }
    const passed = results.filter((s) => s === 200).length;
    const limited = results.filter((s) => s === 429).length;
    expect(passed).toBe(3);
    expect(limited).toBe(2);
  });

  it('returns Retry-After header when 429 is returned', async () => {
    const app = buildRateLimitedApp(1, 60_000);
    const ip = '10.0.0.55';
    // First request passes
    await app.request('/ping', { headers: { 'X-Real-IP': ip } });
    // Second request triggers rate limit
    const res = await app.request('/ping', { headers: { 'X-Real-IP': ip } });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
  });

  it('different IPs have independent rate limit windows', async () => {
    const app = buildRateLimitedApp(1, 60_000);
    const res1 = await app.request('/ping', { headers: { 'X-Real-IP': '192.168.1.1' } });
    const res2 = await app.request('/ping', { headers: { 'X-Real-IP': '192.168.1.2' } });
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });
});
