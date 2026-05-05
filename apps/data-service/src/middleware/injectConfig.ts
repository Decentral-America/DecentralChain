import compose from 'koa-compose';

import inject from './inject';

export default (key, value) => {
  return compose([inject(['config', key], value)]);
};
