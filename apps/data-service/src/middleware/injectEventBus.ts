import { type MiddlewareHandler } from 'hono';
import { pick } from 'ramda';
import { type AppEnv, type EventBus } from '../http/_common/types';

const collectRequestData = (c: Parameters<MiddlewareHandler<AppEnv>>[0]) => ({
  ...pick(['method', 'url'])({ method: c.req.method, url: c.req.url }),
  headers: [...c.req.raw.headers.entries()].map(([k, v]) => `${k}:${v}`).join(';'),
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
