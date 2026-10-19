import { performance } from 'node:perf_hooks';
import { type MiddlewareHandler } from 'hono';
import { type AppEnv } from '../http/_common/types';

// One line per request, written when the response is known.
const accessLogMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const start = performance.now();
  const eventBus = c.get('eventBus');

  await next();

  eventBus.emit('RESPONSE', {
    level: 'info',
    responseTime: performance.now() - start,
    statusCode: c.res.status,
  });
};

export default accessLogMiddleware;
