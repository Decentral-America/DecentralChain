import createDriver from './driver';

import Task from 'folktale/concurrency/task';

export default {
  driver: {
    create: createDriver,
    createT: createDriver(Task.of),
  },
};
