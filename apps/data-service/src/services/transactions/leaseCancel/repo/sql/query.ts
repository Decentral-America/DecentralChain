import { knex as _knex } from 'knex';
const pg = _knex({ client: 'pg' });

const select = pg({ t: 'txs_9' });

const selectFromFiltered = (filtered) =>
  filtered
    .select({
      fee: 't.fee',
      height: 't.height',
      id: 't.id',
      lease_id: 'l.id',
      proofs: 't.proofs',
      sender: 't.sender',
      sender_public_key: 't.sender_public_key',
      signature: 't.signature',
      status: 't.status',
      time_stamp: 't.time_stamp',
      tx_type: 't.tx_type',
      tx_version: 't.tx_version',
      uid: 't.uid',
    })
    .leftJoin({ l: 'txs_8' }, 'l.uid', 'lease_tx_uid');

export { select, selectFromFiltered };
