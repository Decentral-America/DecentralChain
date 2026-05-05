import { knex as _knex } from 'knex';
const pg = _knex({ client: 'pg' });

const select = pg({ t: 'txs_8' });

const selectFromFiltered = (filtered) =>
  filtered.select({
    amount: 't.amount',
    fee: 't.fee',
    height: 't.height',
    id: 't.id',
    proofs: 't.proofs',
    recipient: pg.raw('coalesce(t.recipient_alias, t.recipient_address)'),
    sender: 't.sender',
    sender_public_key: 't.sender_public_key',
    signature: 't.signature',
    status: 't.status',
    time_stamp: 't.time_stamp',
    tx_type: 't.tx_type',
    tx_version: 't.tx_version',
    uid: 't.uid',
  });

export { select, selectFromFiltered };
