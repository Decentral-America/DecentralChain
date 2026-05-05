import { fromNullable, type Maybe } from 'folktale/maybe';
import { head, propEq } from 'ramda';
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
    pg
      .any<DbRawMassTransferTx>(sql.get(id))
      .map(transformResult)
      .map<RawMassTransferTx>(head)
      .map(fromNullable)
      .mapRejected(
        addMeta({
          params: id,
          request: 'transactions.invokeScript.get',
        }),
      ),

  mget: (pg: PgDriver) => (ids: string[]) =>
    pg
      .any<DbRawMassTransferTx>(sql.mget(ids))
      .map(transformResult)
      .map<Maybe<RawMassTransferTx>[]>(matchRequestsResults(propEq('id'), ids))
      .mapRejected(
        addMeta({
          params: ids,
          request: 'transactions.invokeScript.mget',
        }),
      ),

  search: (pg: PgDriver) => (filters: MassTransferTxsSearchRequest<Cursor>) =>
    pg
      .any<DbRawMassTransferTx>(sql.search(filters))
      .map(transformResult)
      .mapRejected(
        addMeta({
          params: filters,
          request: 'transactions.massTransfer.search',
        }),
      ),
};
