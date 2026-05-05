import { knex as _knex } from 'knex';
const pg = _knex({ client: 'pg' });

const select = pg({ t: 'txs_1' });

const selectFromFiltered = (filtered) =>
  filtered.select({
    amount: pg.raw('t.amount'),
    fee: 't.fee',
    height: 't.height',
    id: 't.id',
    proofs: 't.proofs',
    recipient: pg.raw('coalesce(t.recipient_alias, t.recipient_address)'),
    signature: 't.signature',
    status: 't.status',
    time_stamp: 't.time_stamp',
    tx_type: 't.tx_type',
    tx_version: 't.tx_version',
    uid: 't.uid',
  });

export { select, selectFromFiltered };
