import { knex as _knex } from 'knex';
const pg = _knex({ client: 'pg' });

const select = pg({ t: 'txs_3' });

const selectFromFiltered = (filtered) =>
  filtered.select({
    asset_id: 't.asset_id',
    asset_name: 't.asset_name',
    decimals: 't.decimals',
    description: 't.description',
    fee: 't.fee',
    height: 't.height',
    id: 't.id',
    proofs: 't.proofs',
    quantity: 't.quantity',
    reissuable: 't.reissuable',
    script: 't.script',
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
