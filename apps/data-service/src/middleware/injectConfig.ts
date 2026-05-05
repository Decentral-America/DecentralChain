// @ts-expect-error koa-compose has no type declarations
import compose from 'koa-compose';

import inject from './inject';

export default (key: any, value: any) => {
  return compose([inject(['config', key], value)]);
};
