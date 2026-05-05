import { knex as _knex } from 'knex';

const pg = _knex({ client: 'pg' });

const select = pg.from({ t: 'txs_12' }).select('t.uid');

const selectFromFiltered = (filtered: any) =>
  pg
    .with('ts', filtered)
    .select({
      // data values
      data_key: 'td.data_key',
      data_type: 'td.data_type',
      data_value_binary: 'td.data_value_binary',
      data_value_boolean: 'td.data_value_boolean',
      data_value_integer: 'td.data_value_integer',
      data_value_string: 'td.data_value_string',
      fee: 't.fee',
      height: 't.height',
      id: 't.id',
      position_in_tx: 'td.position_in_tx',
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
    .from('ts')
    .join({ t: 'txs_12' }, 'ts.uid', 't.uid')
    .leftJoin({ td: 'txs_12_data' }, 'td.tx_uid', 't.uid');

export default {
  select,
  selectFromFiltered,
};
export { select, selectFromFiltered };
