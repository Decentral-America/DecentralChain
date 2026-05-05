import { knex as _knex } from 'knex';

const pg = _knex({ client: 'pg' });

const select = pg({ t: 'txs_14' });

const selectFromFiltered = (filtered: any) =>
  filtered.column({
    asset_id: 't.asset_id',
    fee: 't.fee',
    height: 't.height',
    id: 't.id',
    min_sponsored_asset_fee: 't.min_sponsored_asset_fee',
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
