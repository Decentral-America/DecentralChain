import { findIndex, slice, concat, type, curryN } from 'ramda';

const hasMethod = curryN(
  2,
  (method, x) => (x && x[method] && type(x[method]) === 'Function') || false,
);

const createPointfree =
  (method) =>
  (...args) => {
    const instanceIdx = findIndex(hasMethod(method), args);

    if (instanceIdx !== -1) {
      return args[instanceIdx].clone()[method](...slice(0, instanceIdx, args));
    } else {
      return (...args2) => createPointfree(method)(...concat(args, args2));
    }
  };

export default {
  hasMethod,
  limit: createPointfree('limit'),
  orderBy: createPointfree('orderBy'),
  orWhere: createPointfree('orWhere'),
  raw: createPointfree('raw'),
  where: createPointfree('where'),
  whereIn: createPointfree('whereIn'),
  whereNotNull: createPointfree('whereNotNull'),
  whereNull: createPointfree('whereNull'),
  whereRaw: createPointfree('whereRaw'),
};
