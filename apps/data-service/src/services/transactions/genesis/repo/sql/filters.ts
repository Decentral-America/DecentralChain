// @ts-nocheck
import { omit, without } from 'ramda';

import { createByBlockTimeStamp, createByTimeStamp } from '../../../_common/sql';
import commonFilters from '../../../_common/sql/filters';
import commonFiltersOrder from '../../../_common/sql/filtersOrder';

const byTimeStamp = createByTimeStamp('txs_1');

const byBlockTimeStamp = createByBlockTimeStamp('txs_1');

export const filters = omit(['sender'], {
  ...commonFilters,
  blockTimeEnd: byBlockTimeStamp('<='),
  blockTimeStart: byBlockTimeStamp('>='),
  timeEnd: byTimeStamp('<='),

  timeStart: byTimeStamp('>='),
});
export const filtersOrder = without('sender', [
  ...commonFiltersOrder,
  'timeStart',
  'timeEnd',
  'recipient',
]);
