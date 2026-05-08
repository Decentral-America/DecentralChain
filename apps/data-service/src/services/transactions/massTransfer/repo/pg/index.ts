import { Effect, Option, pipe } from 'effect';
import { head } from 'ramda';
import { type PgDriver } from '../../../../../db/driver';
import { addMeta } from '../../../../../errorHandling';
import { matchRequestsResults } from '../../../../../utils/db';
import { type Cursor } from '../../../_common/cursor';
import { type MassTransferTxsSearchRequest, type RawMassTransferTx } from '../types';
import sql from './sql';
import { transformResult } from './transformResult';
import { type DbRawMassTransferTx } from './types';

export default {
  get: (pg: PgDriver) => (id: string) =>
    pipe(
      pg.any<DbRawMassTransferTx>(sql.get(id)),
      Effect.map((rows) => transformResult(rows)),
      Effect.map((rows) => Option.fromNullable(head(rows as RawMassTransferTx[]))),
      Effect.mapError(addMeta({ params: id, request: 'transactions.massTransfer.get' })),
    ),

  mget: (pg: PgDriver) => (ids: string[]) =>
    pipe(
      pg.any<DbRawMassTransferTx>(sql.mget(ids)),
      Effect.map((rows) => transformResult(rows)),
      Effect.map(
        matchRequestsResults((req: string, res: any) => res.id === req, ids) as unknown as (
          rows: RawMassTransferTx[],
        ) => Option.Option<RawMassTransferTx>[],
      ),
      Effect.mapError(addMeta({ params: ids, request: 'transactions.massTransfer.mget' })),
    ),

  search: (pg: PgDriver) => (filters: MassTransferTxsSearchRequest<Cursor>) =>
    pipe(
      pg.any<DbRawMassTransferTx>(sql.search(filters)),
      Effect.map((rows) => transformResult(rows) as RawMassTransferTx[]),
      Effect.mapError(addMeta({ params: filters, request: 'transactions.massTransfer.search' })),
    ),
};
