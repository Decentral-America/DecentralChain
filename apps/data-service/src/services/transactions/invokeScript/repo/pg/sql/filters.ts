import type * as knex from 'knex';

import * as pointFreeKnex from '../../../../../../utils/db/knex';
import { createByBlockTimeStamp, createByTimeStamp } from '../../../../_common/sql';
import * as commonFilters from '../../../../_common/sql/filters';

const byDapp = (dappAddressOrAlias: string) => (q: knex.QueryBuilder) =>
  q
    .clone()
    .whereRaw(
      `dapp_address = coalesce((select sender from txs_10 where alias = '${dappAddressOrAlias}' limit 1), '${dappAddressOrAlias}')`,
    );

const byTimeStamp = createByTimeStamp('txs_16');

const byBlockTimeStamp = createByBlockTimeStamp('txs_16');

export default {
  ...commonFilters,
  blockTimeEnd: byBlockTimeStamp('<='),
  blockTimeStart: byBlockTimeStamp('>='),

  dapp: byDapp,
  function: pointFreeKnex.where('function_name'),
  timeEnd: byTimeStamp('<='),
  timeStart: byTimeStamp('>='),
};
