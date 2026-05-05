// @ts-nocheck
import { type Option } from 'effect';
import { head, propEq } from 'ramda';
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
    pg
      .any<DbRawInvokeScriptTx>(sql.get(id))
      .map(transformResult)
      .map<RawInvokeScriptTx>(head)
      .map(fromNullable)
      .mapRejected(
        addMeta({
          params: id,
          request: 'transactions.invokeScript.get',
        }),
      ),

  mget: (pg: PgDriver) => (ids: string[]) =>
    pg
      .any<DbRawInvokeScriptTx>(sql.mget(ids))
      .map(transformResult)
      .map<Option.Option<RawInvokeScriptTx>[]>(matchRequestsResults(propEq('id'), ids))
      .mapRejected(
        addMeta({
          params: ids,
          request: 'transactions.invokeScript.mget',
        }),
      ),

  search: (pg: PgDriver) => (filters: InvokeScriptTxsSearchRequest<Cursor>) =>
    pg
      .any<DbRawInvokeScriptTx>(sql.search(filters))
      .map(transformResult)
      .mapRejected(
        addMeta({
          params: filters,
          request: 'transactions.invokeScript.search',
        }),
      ),
};
