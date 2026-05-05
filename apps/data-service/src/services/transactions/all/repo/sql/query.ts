import * as knex from 'knex';

const pg = knex({ client: 'pg' });

export const select = pg({ t: 'txs' }).select({
  id: 't.id',
  time_stamp: 't.time_stamp',
  tx_type: 't.tx_type',
  uid: 't.uid',
});
