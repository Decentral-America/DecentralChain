// @ts-nocheck
import { knex as _knex } from 'knex';
import { curryN } from 'ramda';
import { createByBlockTimeStamp, createByTimeStamp } from '../../../_common/sql';
import commonFilters from '../../../_common/sql/filters';

const pg = _knex({ client: 'pg' });

const byOrderSender = curryN(2, (orderSender, q) =>
  pg.union(
    [
      q.clone().whereRaw(`t.order1->>'sender' = '${orderSender}'`),
      q.clone().whereRaw(`t.order2->>'sender' = '${orderSender}'`),
    ],
    true,
  ),
);

const byOrderSenders = curryN(2, (senders, q) =>
  q.clone().whereRaw(`array[order1->>'sender', order2->>'sender'] && ?`, `{${senders.join(',')}}`),
);

const byOrder = curryN(2, (orderId, q) =>
  q.clone().whereRaw(`array[t.order1->>'id', t.order2->>'id'] @> array['${orderId}']`).limit(1),
);

const byAsset = (assetType) =>
  curryN(2, (assetId, q) => q.clone().where(`t.${assetType}_asset_id`, assetId));

const byTimeStamp = createByTimeStamp('txs_7');

const byBlockTimeStamp = createByBlockTimeStamp('txs_7');

export const filters: any = {
  ...commonFilters,
  amountAsset: byAsset('amount'),
  blockTimeEnd: byBlockTimeStamp('<='),
  blockTimeStart: byBlockTimeStamp('>='),

  matcher: commonFilters.sender,
  orderId: byOrder,
  priceAsset: byAsset('price'),
  sender: byOrderSender,
  senders: byOrderSenders,
  timeEnd: byTimeStamp('<='),
  timeStart: byTimeStamp('>='),
};
