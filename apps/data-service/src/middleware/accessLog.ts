import { performance } from 'node:perf_hooks';

const accessLogMiddleware = async (ctx: any, next: any) => {
  const start = performance.now();
  ctx.eventBus.emit('REQUEST', { level: 'info' });

  await next();

  ctx.eventBus.emit('RESPONSE', {
    level: 'info',
    responseTime: performance.now() - start,
    statusCode: ctx.status,
  });
};

export default accessLogMiddleware;
