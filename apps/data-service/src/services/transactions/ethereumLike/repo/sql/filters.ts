import { where, whereNull, whereNotNull } from '../../../../../utils/db/knex';

import { createByTimeStamp, createByBlockTimeStamp } from '../../../_common/sql';
import { id, ids, sender, senders, sort, after, limit } from '../../../_common/sql/filters';
import commonFiltersOrder from '../../../_common/sql/filtersOrder';

const byTimeStamp = createByTimeStamp('txs_18');

const byBlockTimeStamp = createByBlockTimeStamp('txs_18');

export default {
  filters: {
    after,
    blockTimeEnd: byBlockTimeStamp('<='),
    blockTimeStart: byBlockTimeStamp('>='),

    function: (functionName) => where('function_name', functionName),
    id,
    ids,
    limit,
    sender,
    senders,
    sort,
    timeEnd: byTimeStamp('<='),

    timeStart: byTimeStamp('>='),

    type: (transferOrInvocation) =>
      transferOrInvocation === 'transfer'
        ? whereNull('function_name')
        : whereNotNull('function_name'),
  },
  filtersOrder: [...commonFiltersOrder, 'timeStart', 'timeEnd', 'type', 'function'],
};
