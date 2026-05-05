import { createByTimeStamp, createByBlockTimeStamp } from '../../../_common/sql';
import commonFilters from '../../../_common/sql/filters';
import commonFiltersOrder from '../../../_common/sql/filtersOrder';

const byTimeStamp = createByTimeStamp('txs_6');

const byBlockTimeStamp = createByBlockTimeStamp('txs_6');

export default {
  filters: {
    ...commonFilters,
    blockTimeEnd: byBlockTimeStamp('<='),
    blockTimeStart: byBlockTimeStamp('>='),
    timeEnd: byTimeStamp('<='),

    timeStart: byTimeStamp('>='),
  },
  filtersOrder: [...commonFiltersOrder, 'timeStart', 'timeEnd', 'assetId'],
};
