import { knex as _knex } from 'knex';

const pg = _knex({ client: 'pg' });

const select = pg({ t: 'txs_13' });

const selectFromFiltered = (filtered: any) =>
  filtered.select({
    fee: 't.fee',
    height: 't.height',
    id: 't.id',
    proofs: 't.proofs',

    // type-specific
    script: 't.script',
    sender: 't.sender',
    sender_public_key: 't.sender_public_key',
    signature: 't.signature',
    status: 't.status',
    time_stamp: 't.time_stamp',
    tx_type: 't.tx_type',
    tx_version: 't.tx_version',
    // common
    uid: 't.uid',
  });

export { select, selectFromFiltered };
