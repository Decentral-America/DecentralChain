import { assocPath } from 'ramda';

export default (path: any, value: any) => async (ctx: any, next: any) => {
  ctx.state = assocPath(path, value, ctx.state);
  await next();
};
