import { knex as _knex } from 'knex';
const pg = _knex({ client: 'pg' });

const columnsWithoutRecipient = {
  // type-specific
  amount: 't.amount',
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
  // common
  uid: 't.uid',
};

const select = pg({ t: 'txs_2' });

const selectFromFiltered = (s) => (filtered) =>
  pg
    .select(columnsWithoutRecipient)
    .select({ recipient: 't.recipient' })
    .from({
      t: filtered
        .select(columnsWithoutRecipient)
        .select({
          recipient: pg.raw('coalesce(t.recipient_alias, t.recipient_address)'),
        })
        .select({
          rn: pg.raw(`row_number() over (partition by uid order by uid ${s})`),
        }),
    })
    .where('rn', '=', 1);

export { select, selectFromFiltered };
