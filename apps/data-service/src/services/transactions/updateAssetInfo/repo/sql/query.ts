import { knex as _knex } from 'knex';

const pg = _knex({ client: 'pg' });

const select = pg({ t: 'txs_17' });

const selectFromFiltered = (filtered: any) =>
  filtered.column({
    asset_id: 't.asset_id',
    asset_name: 't.asset_name',
    description: 't.description',
    fee: 't.fee',
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
  });

export { select, selectFromFiltered };
