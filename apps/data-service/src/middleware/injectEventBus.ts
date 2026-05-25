import { type MiddlewareHandler } from 'hono';
import { pick } from 'ramda';
import { type AppEnv, type EventBus } from '../http/_common/types';

// Headers that carry credentials or tokens — must never appear in logs.
const REDACTED_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
  'proxy-authorization',
]);

const collectRequestData = (c: Parameters<MiddlewareHandler<AppEnv>>[0]) => ({
  ...pick(['method', 'url'])({ method: c.req.method, url: c.req.url }),
  headers: [...c.req.raw.headers.entries()]
    .map(([k, v]) => `${k}:${REDACTED_HEADERS.has(k.toLowerCase()) ? '[REDACTED]' : v}`)
    .join(';'),
  requestId: c.get('requestId') ?? '',
});

export default (rawEventBus: {
  emit: (event: string, data: unknown) => void;
}): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    const request = collectRequestData(c);
    const emit = (message: string, data: unknown) =>
      rawEventBus.emit('log', { data, message, request });
    c.set('eventBus', { emit } as EventBus);
    await next();
  };
