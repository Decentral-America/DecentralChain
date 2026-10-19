import { knex } from 'knex';

const pg = knex({ client: 'pg' });

// txs_19 (CommitToGeneration) inherits txs, so its rows are visible here. data-service
// has no type-19 service, and services/transactions/all looks each row up through a
// per-type service, so a type-19 row would have no handler. Exclude it until a
// CommitToGeneration route exists.
export const EXCLUDED_TX_TYPES: number[] = [19];

export const select = pg({ t: 'txs' }).whereNotIn('t.tx_type', EXCLUDED_TX_TYPES).select({
  id: 't.id',
  time_stamp: 't.time_stamp',
  tx_type: 't.tx_type',
  uid: 't.uid',
});
