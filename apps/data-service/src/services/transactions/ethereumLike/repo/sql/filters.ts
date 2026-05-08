import { where, whereNotNull, whereNull } from '../../../../../utils/db/knex';

import { createByBlockTimeStamp, createByTimeStamp } from '../../../_common/sql';
import { after, id, ids, limit, sender, senders, sort } from '../../../_common/sql/filters';
import commonFiltersOrder from '../../../_common/sql/filtersOrder';

const byTimeStamp = createByTimeStamp('txs_18');

const byBlockTimeStamp = createByBlockTimeStamp('txs_18');

export const filters = {
  after,
  blockTimeEnd: byBlockTimeStamp('<='),
  blockTimeStart: byBlockTimeStamp('>='),

  function: (functionName: string) => where('function_name', functionName),
  id,
  ids,
  limit,
  sender,
  senders,
  sort,
  timeEnd: byTimeStamp('<='),

  timeStart: byTimeStamp('>='),

  type: (transferOrInvocation: string) =>
    transferOrInvocation === 'transfer'
      ? whereNull('function_name')
      : whereNotNull('function_name'),
};
export const filtersOrder = [...commonFiltersOrder, 'timeStart', 'timeEnd', 'type', 'function'];
