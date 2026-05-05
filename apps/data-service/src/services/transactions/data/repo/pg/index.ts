import * as Maybe from 'folktale/maybe';
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
import * as transformResult from './transformResult';

export const pg = {
  get: (pg: PgDriver) => (id: DataTxsGetRequest) =>
    pg
      .any(sql.get(id))
      .map(transformResult)
      .map<DataTxDbResponse>(head)
      .map(Maybe.fromNullable)
      .mapRejected(addMeta({ params: id, request: 'transactions.data.get' })),

  mget: (pg: PgDriver) => (ids: DataTxsMgetRequest) =>
    pg
      .any(sql.mget(ids))
      .map(transformResult)
      .map<Maybe.Maybe<DataTxDbResponse>[]>(matchRequestsResults(propEq('id'), ids))
      .mapRejected(addMeta({ params: ids, request: 'transactions.data.mget' })),

  search: (pg: PgDriver) => (filters: DataTxsSearchRequest<Cursor>) =>
    pg
      .any(sql.search(filters))
      .map<DataTxDbResponse[]>(transformResult)
      .mapRejected(
        addMeta({
          params: filters,
          request: 'transactions.data.search',
        }),
      ),
};
