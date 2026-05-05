// @ts-nocheck
import { BigNumber } from '@decentralchain/data-entities';
import { curryN } from 'ramda';

import { createByBlockTimeStamp, createByTimeStamp } from '../../../../_common/sql';
import commonFilters from '../../../../_common/sql/filters';

const byKey = curryN(2, (key: any, q: any) =>
  q.clone().whereIn('t.uid', function (this: any) {
    this.select('tx_uid').from('txs_12_data').where('data_key', key);
  }),
);

const byType = curryN(2, (type: any, q: any) =>
  q.clone().whereIn('t.uid', function (this: any) {
    this.select('tx_uid').from('txs_12_data').where('data_type', type);
  }),
);

const byValue = curryN(3, (type: any, value: any, q: any) => {
  const v = value instanceof BigNumber ? value.toString() : value;
  return q.clone().whereIn('t.uid', function (this: any) {
    this.select('tx_uid')
      .from('txs_12_data')
      .where('data_type', type)
      .andWhere(`data_value_${type}`, v);
  });
});

const byTimeStamp = createByTimeStamp('txs_12');

const byBlockTimeStamp = createByBlockTimeStamp('txs_12');

const _defaultExport: any = {
  ...commonFilters,
  blockTimeEnd: byBlockTimeStamp('<='),
  blockTimeStart: byBlockTimeStamp('>='),

  key: byKey,
  timeEnd: byTimeStamp('<='),
  timeStart: byTimeStamp('>='),
  type: byType,
  value: byValue,
};
export default _defaultExport;
