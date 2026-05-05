import { knex as _knex } from 'knex';

const pg = _knex({ client: 'pg' });

const select = pg({ t: 'txs_11' })
  .leftJoin({ tfs: 'txs_11_transfers' }, 'tfs.tx_uid', '=', 't.uid')
  .groupBy('t.uid')
  .select('t.uid');

const selectFromFiltered = (filtered: any) =>
  pg
    .select({
      amount: 'tfs.amount',
      asset_id: 't.asset_id',
      attachment: 't.attachment',
      fee: 't.fee',
      height: 't.height',
      id: 't.id',
      position_in_tx: 'tfs.position_in_tx',
      proofs: 't.proofs',
      recipient_address: 'tfs.recipient_address',
      recipient_alias: 'tfs.recipient_alias',
      sender: 't.sender',
      sender_public_key: 't.sender_public_key',
      signature: 't.signature',
      status: 't.status',
      time_stamp: 't.time_stamp',
      tx_type: 't.tx_type',
      tx_version: 't.tx_version',
      uid: 't.uid',
    })
    .from({ t: 'txs_11' })
    .leftJoin({ tfs: 'txs_11_transfers' }, 'tfs.tx_uid', '=', 't.uid')
    .whereIn('t.uid', filtered);

export default {
  select,
  selectFromFiltered,
};
export { select, selectFromFiltered };
