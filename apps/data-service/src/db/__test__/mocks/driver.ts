// @ts-nocheck
import { curry, reduce } from 'ramda';

const createDriver = curry((resolve, fn) => {
  const m = (...args) => resolve(fn(...args));

  const ms = ['none', 'any', 'one', 'many', 'oneOrNone', 'oneOrMany', 'task', 'tx'];

  return reduce(
    (acc: any, x: any) => {
      acc[x] = m;
      return acc;
    },
    {},
    ms,
  );
});

export default createDriver;
