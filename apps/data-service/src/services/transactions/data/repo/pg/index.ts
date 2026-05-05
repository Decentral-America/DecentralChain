// @ts-nocheck
import { Effect, Option, pipe } from 'effect';
import { head, propEq } from 'ramda';
import { type PgDriver } from '../../../../../db/driver';
import { addMeta } from '../../../../../errorHandling';
import { matchRequestsResults } from '../../../../../utils/db/index';
import { type Cursor } from '../../../_common/cursor';
import {
  type DataTxDbResponse,
  type DataTxsGetRequest,
  type DataTxsMgetRequest,
  type DataTxsSearchRequest,
} from '../types';
import sql from './sql';
import transformResult from './transformResult';

export const pg = {
  get: (pg: PgDriver) => (id: DataTxsGetRequest) =>
    pipe(
      pg.any(sql.get(id)),
      Effect.map(transformResult),
      Effect.map((rows) => Option.fromNullable(head(rows) as DataTxDbResponse | undefined)),
      Effect.mapError(addMeta({ params: id, request: 'transactions.data.get' })),
    ),

  mget: (pg: PgDriver) => (ids: DataTxsMgetRequest) =>
    pipe(
      pg.any(sql.mget(ids)),
      Effect.map(transformResult),
      Effect.map(
        matchRequestsResults(propEq('id'), ids) as unknown as (
          rows: DataTxDbResponse[],
        ) => Option.Option<DataTxDbResponse>[],
      ),
      Effect.mapError(addMeta({ params: ids, request: 'transactions.data.mget' })),
    ),

  search: (pg: PgDriver) => (filters: DataTxsSearchRequest<Cursor>) =>
    pipe(
      pg.any(sql.search(filters)),
      Effect.map(transformResult as (rows: unknown[]) => DataTxDbResponse[]),
      Effect.mapError(
        addMeta({
          params: filters,
          request: 'transactions.data.search',
        }),
      ),
    ),
};
