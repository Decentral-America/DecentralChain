import { createByTimeStamp, createByBlockTimeStamp } from '../../../_common/sql';
import commonFilters from '../../../_common/sql/filters';
import commonFiltersOrder from '../../../_common/sql/filtersOrder';

const byTimeStamp = createByTimeStamp('txs_15');

const byBlockTimeStamp = createByBlockTimeStamp('txs_15');

export default {
  filters: {
    ...commonFilters,
    blockTimeEnd: byBlockTimeStamp('<='),
    blockTimeStart: byBlockTimeStamp('>='),
    timeEnd: byTimeStamp('<='),

    timeStart: byTimeStamp('>='),
  },
  filtersOrder: [...commonFiltersOrder, 'timeStart', 'timeEnd', 'assetId', 'script'],
};
