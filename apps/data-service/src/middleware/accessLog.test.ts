import { Hono } from 'hono';
import { requestId } from 'hono/request-id';
import { describe, expect, it } from 'vitest';
import { type AppEnv } from '../http/_common/types';
import accessLogMiddleware from './accessLog';
import injectEventBus from './injectEventBus';

describe('access log', () => {
  it('logs one RESPONSE line per request and never the raw headers', async () => {
    const events: Array<{ message: string; request: Record<string, unknown> }> = [];
    const bus = {
      emit: (_name: string, payload: unknown) => {
        events.push(payload as { message: string; request: Record<string, unknown> });
      },
    };
    const app = new Hono<AppEnv>();
    app.use(requestId());
    app.use(injectEventBus(bus));
    app.use(accessLogMiddleware);
    app.get('/ping', (c) => c.json({ ok: true }));

    await app.request('/ping', {
      headers: {
        Authorization: 'Bearer SECRET-AUTH',
        Cookie: 'session=SECRET',
        'User-Agent': 'probe/1.0',
        'X-Api-Key': 'SECRET-KEY',
        'X-E2E-Bypass': 'SECRET-BYPASS',
      },
    });

    expect(events.map((e) => e.message)).toEqual(['RESPONSE']);
    const [only] = events;
    expect(only?.request).not.toHaveProperty('headers');
    expect(only?.request['userAgent']).toBe('probe/1.0');
    expect(JSON.stringify(events)).not.toContain('SECRET');
  });
});
