import { knex as _knex } from 'knex';

const pg = _knex({ client: 'pg' });

const select = pg({ t: 'txs_4' });

const selectFromFiltered = (filtered: any) =>
  filtered.select({
    amount: 't.amount',

    // type-specific
    asset_id: 't.asset_id',
    attachment: 't.attachment',
    fee: 't.fee',
    fee_asset: 't.fee_asset_id',
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
    // common
    uid: 't.uid',
  });

export default {
  select,
  selectFromFiltered,
};
export { select, selectFromFiltered };
