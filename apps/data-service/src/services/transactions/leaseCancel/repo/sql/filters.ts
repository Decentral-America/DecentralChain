import { whereIn } from '../../../../../utils/db/knex';

import { createByBlockTimeStamp, createByTimeStamp } from '../../../_common/sql';
import commonFilters from '../../../_common/sql/filters';
import commonFiltersOrder from '../../../_common/sql/filtersOrder';

// txs_9 do not contain recipient info directly
// only txs_8 do
const byRecipient = (addressOrAlias: string) =>
  whereIn('lease_tx_uid', function (this: any) {
    this.select('uid')
      .from('txs_8')
      .whereRaw(
        `recipient_address = coalesce((select sender from txs_10 where alias = '${addressOrAlias}' limit 1), '${addressOrAlias}')`,
      );
  });

const byTimeStamp = createByTimeStamp('txs_9');

const byBlockTimeStamp = createByBlockTimeStamp('txs_9');

export const filters = {
  ...commonFilters,
  blockTimeEnd: byBlockTimeStamp('<='),
  blockTimeStart: byBlockTimeStamp('>='),

  recipient: byRecipient,
  timeEnd: byTimeStamp('<='),
  timeStart: byTimeStamp('>='),
};
export const filtersOrder = [...commonFiltersOrder, 'timeStart', 'timeEnd', 'recipient'];
