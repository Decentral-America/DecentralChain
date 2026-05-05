import { where } from '../../../../../utils/db/knex';

import { createByBlockTimeStamp, createByTimeStamp } from '../../../_common/sql';
import commonFilters from '../../../_common/sql/filters';
import commonFiltersOrder from '../../../_common/sql/filtersOrder';

const byTimeStamp = createByTimeStamp('txs_10');

const byBlockTimeStamp = createByBlockTimeStamp('txs_10');

export const filters = {
  ...commonFilters,

  alias: where('alias'),
  blockTimeEnd: byBlockTimeStamp('<='),
  blockTimeStart: byBlockTimeStamp('>='),
  timeEnd: byTimeStamp('<='),
  timeStart: byTimeStamp('>='),
};
export const filtersOrder = [...commonFiltersOrder, 'timeStart', 'timeEnd', 'alias'];
