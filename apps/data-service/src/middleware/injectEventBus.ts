import { pick, curryN } from 'ramda';

const collectRequestData = (ctx) => ({
  ...pick(['headers', 'httpVersion', 'method', 'url'])(ctx.request),
  headers: Object.entries(ctx.request.headers)
    .map((h) => h.join(':'))
    .join(';'),
  requestId: ctx.state.id,
});

export default (eventBus) => async (ctx, next) => {
  // Add request info to all logs
  const request = collectRequestData(ctx);
  const emit = curryN(2, (message, data) => eventBus.emit('log', { data, message, request }));
  ctx.eventBus = { emit };
  await next();
};
