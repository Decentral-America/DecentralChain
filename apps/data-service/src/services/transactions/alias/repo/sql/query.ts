import { knex as _knex } from 'knex';

const pg = _knex({ client: 'pg' });

const columns = {
  alias: 't.alias',
  fee: pg.raw('t.fee'),
  height: 't.height',
  id: 't.id',
  proofs: 't.proofs',
  sender: 't.sender',
  sender_public_key: 't.sender_public_key',
  signature: 't.signature',
  status: 't.status',
  time_stamp: 't.time_stamp',
  tx_type: 't.tx_type',
  tx_version: 't.tx_version',
  uid: 't.uid',
};

const select = pg({ t: 'txs_10' });

const selectFromFiltered = (s: any) => (filtered: any) =>
  pg
    .select(columns)
    .from({
      t: filtered.select(columns).select({
        rn: pg.raw(`row_number() over (partition by uid order by uid ${s})`),
      }),
    })
    .where('rn', '=', 1);

export { select, selectFromFiltered };
