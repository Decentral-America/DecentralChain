import { where } from '../../../../../utils/db/knex';

import { createByTimeStamp, createByBlockTimeStamp } from '../../../_common/sql';
import commonFilters from '../../../_common/sql/filters';
import commonFiltersOrder from '../../../_common/sql/filtersOrder';

const byTimeStamp = createByTimeStamp('txs_17');

const byBlockTimeStamp = createByBlockTimeStamp('txs_17');

export default {
  filters: {
    ...commonFilters,

    assetId: where('asset_id'),
    blockTimeEnd: byBlockTimeStamp('<='),
    blockTimeStart: byBlockTimeStamp('>='),
    timeEnd: byTimeStamp('<='),
    timeStart: byTimeStamp('>='),
  },
  filtersOrder: [...commonFiltersOrder, 'timeStart', 'timeEnd', 'assetId'],
};
