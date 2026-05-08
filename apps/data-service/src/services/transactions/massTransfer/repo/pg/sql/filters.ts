import { createByBlockTimeStamp, createByTimeStamp } from '../../../../_common/sql';
import commonFilters from '../../../../_common/sql/filters';
import commonFiltersOrder from '../../../../_common/sql/filtersOrder';

const byRecipient = (addressOrAlias: string) => (q: any) =>
  q
    .clone()
    .whereRaw(
      `tfs.recipient_address = coalesce((select sender from txs_10 where alias = '${addressOrAlias}' limit 1), '${addressOrAlias}')`,
    );

const byTimeStamp = createByTimeStamp('txs_11');

const byBlockTimeStamp = createByBlockTimeStamp('txs_11');

export const filters = {
  ...commonFilters,
  blockTimeEnd: byBlockTimeStamp('<='),
  blockTimeStart: byBlockTimeStamp('>='),

  recipient: byRecipient,
  timeEnd: byTimeStamp('<='),
  timeStart: byTimeStamp('>='),
};
export const filtersOrder = [...commonFiltersOrder, 'timeStart', 'timeEnd', 'assetId', 'recipient'];
