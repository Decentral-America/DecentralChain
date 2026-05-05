import { curryN, pick } from 'ramda';

const collectRequestData = (ctx: any) => ({
  ...pick(['headers', 'httpVersion', 'method', 'url'])(ctx.request),
  headers: Object.entries(ctx.request.headers)
    .map((h) => h.join(':'))
    .join(';'),
  requestId: ctx.state.id,
});

export default (eventBus: any) => async (ctx: any, next: any) => {
  // Add request info to all logs
  const request = collectRequestData(ctx);
  const emit = curryN(2, (message: any, data: any) =>
    eventBus.emit('log', { data, message, request }),
  );
  ctx.eventBus = { emit };
  await next();
};
