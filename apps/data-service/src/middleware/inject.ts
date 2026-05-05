import { assocPath } from 'ramda';

export default (path, value) => async (ctx, next) => {
  ctx.state = assocPath(path, value, ctx.state);
  await next();
};
