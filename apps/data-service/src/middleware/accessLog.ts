import { performance } from 'node:perf_hooks';
import { type MiddlewareHandler } from 'hono';
import { type AppEnv } from '../http/_common/types';

const accessLogMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const start = performance.now();
  const eventBus = c.get('eventBus');
  eventBus.emit('REQUEST', { level: 'info' });

  await next();

  eventBus.emit('RESPONSE', {
    level: 'info',
    responseTime: performance.now() - start,
    statusCode: c.res.status,
  });
};

export default accessLogMiddleware;
