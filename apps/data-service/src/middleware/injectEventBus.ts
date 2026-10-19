import { type MiddlewareHandler } from 'hono';
import { type AppEnv, type EventBus } from '../http/_common/types';

// Only what is needed to trace a request. Raw headers are deliberately not
// logged: they doubled log volume and can carry credentials.
const collectRequestData = (c: Parameters<MiddlewareHandler<AppEnv>>[0]) => ({
  method: c.req.method,
  requestId: c.get('requestId') ?? '',
  url: c.req.url,
  userAgent: c.req.header('user-agent') ?? '',
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
