import { type Task, of as task } from 'folktale/concurrency/task';
import { type Maybe } from 'folktale/maybe';
import { isEmpty } from 'ramda';
import { type PgDriver } from '../../../../../db/driver';
import { addMeta, type DbError, type Timeout } from '../../../../../errorHandling';
import { matchRequestsResults } from '../../../../../utils/db';

export const getData =
  <ResponseRaw, Id = string>({
    matchRequestResult,
    name,
    sql,
    pg,
  }: {
    name: string;
    sql: (req: Id[]) => string;
    matchRequestResult: (req: Id[], res: ResponseRaw) => boolean;
    pg: PgDriver;
  }) =>
  (req: Id[]): Task<DbError | Timeout, Maybe<ResponseRaw>[]> =>
    isEmpty(req)
      ? task([])
      : pg
          .any<ResponseRaw>(sql(req))
          .map((responses) => matchRequestsResults(matchRequestResult, req, responses))
          .mapRejected(addMeta({ params: req, request: name }));
