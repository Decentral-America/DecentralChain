import { without, omit } from 'ramda';

import { createByTimeStamp, createByBlockTimeStamp } from '../../../_common/sql';
import commonFilters from '../../../_common/sql/filters';
import commonFiltersOrder from '../../../_common/sql/filtersOrder';

const byTimeStamp = createByTimeStamp('txs_1');

const byBlockTimeStamp = createByBlockTimeStamp('txs_1');

export default {
  filters: omit(['sender'], {
    ...commonFilters,
    blockTimeEnd: byBlockTimeStamp('<='),
    blockTimeStart: byBlockTimeStamp('>='),
    timeEnd: byTimeStamp('<='),

    timeStart: byTimeStamp('>='),
  }),

  filtersOrder: without('sender', [...commonFiltersOrder, 'timeStart', 'timeEnd', 'recipient']),
};
