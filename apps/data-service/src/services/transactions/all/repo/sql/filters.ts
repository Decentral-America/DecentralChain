import { createByBlockTimeStamp, createByTimeStamp } from '../../../_common/sql';
import * as commonFilters from '../../../_common/sql/filters';
import commonFiltersOrder from '../../../_common/sql/filtersOrder';

const byTimeStamp = createByTimeStamp('txs');

const byBlockTimesStamp = createByBlockTimeStamp('txs');

export const filters = {
  ...commonFilters,
  blockTimeEnd: byBlockTimesStamp('<='),
  blockTimeStart: byBlockTimesStamp('>='),
  timeEnd: byTimeStamp('<='),

  timeStart: byTimeStamp('>='),
};
export const filtersOrder = [...commonFiltersOrder, 'timeStart', 'timeEnd'];
