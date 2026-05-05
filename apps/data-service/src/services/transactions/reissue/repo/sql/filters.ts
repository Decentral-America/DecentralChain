import { createByBlockTimeStamp, createByTimeStamp } from '../../../_common/sql';
import commonFilters from '../../../_common/sql/filters';
import commonFiltersOrder from '../../../_common/sql/filtersOrder';

const byTimeStamp = createByTimeStamp('txs_5');

const byBlockTimeStamp = createByBlockTimeStamp('txs_5');

export const filters = {
  ...commonFilters,
  blockTimeEnd: byBlockTimeStamp('<='),
  blockTimeStart: byBlockTimeStamp('>='),
  timeEnd: byTimeStamp('<='),

  timeStart: byTimeStamp('>='),
};
export const filtersOrder = [...commonFiltersOrder, 'timeStart', 'timeEnd', 'assetId'];
