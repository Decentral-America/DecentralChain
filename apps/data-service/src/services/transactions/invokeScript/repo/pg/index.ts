import { Effect, Option, pipe } from 'effect';
import { head } from 'ramda';
import { type PgDriver } from '../../../../../db/driver';
import { addMeta } from '../../../../../errorHandling';
import { matchRequestsResults } from '../../../../../utils/db';
import { type Cursor } from '../../../_common/cursor';
import {
  type RawInvokeScriptTx as DbRawInvokeScriptTx,
  type InvokeScriptTxsSearchRequest,
  type RawInvokeScriptTx,
} from '../types';
import sql from './sql';
import { transformResult } from './transformResult';

export default {
  get: (pg: PgDriver) => (id: string) =>
    pipe(
      pg.any<DbRawInvokeScriptTx>(sql.get(id)),
      Effect.map((rows) => transformResult(rows)),
      Effect.map((rows) => Option.fromNullable(head(rows as RawInvokeScriptTx[]))),
      Effect.mapError(addMeta({ params: id, request: 'transactions.invokeScript.get' })),
    ),

  mget: (pg: PgDriver) => (ids: string[]) =>
    pipe(
      pg.any<DbRawInvokeScriptTx>(sql.mget(ids)),
      Effect.map((rows) => transformResult(rows)),
      Effect.map(
        matchRequestsResults((req: string, res: any) => res.id === req, ids) as unknown as (
          rows: RawInvokeScriptTx[],
        ) => Option.Option<RawInvokeScriptTx>[],
      ),
      Effect.mapError(addMeta({ params: ids, request: 'transactions.invokeScript.mget' })),
    ),

  search: (pg: PgDriver) => (filters: InvokeScriptTxsSearchRequest<Cursor>) =>
    pipe(
      pg.any<DbRawInvokeScriptTx>(sql.search(filters) as string),
      Effect.map((rows) => transformResult(rows) as RawInvokeScriptTx[]),
      Effect.mapError(addMeta({ params: filters, request: 'transactions.invokeScript.search' })),
    ),
};
