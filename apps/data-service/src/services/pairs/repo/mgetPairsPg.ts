import { type Task } from 'folktale/concurrency/task';
import { type Maybe } from 'folktale/maybe';
import { type PgDriver } from '../../../db/driver';
import { addMeta, type DbError, type Timeout } from '../../../errorHandling';
import { matchRequestsResults } from '../../../utils/db';
import { type PairsMgetRequest } from './types';

export const mgetPairsPg =
  <Request extends PairsMgetRequest, ResponseRaw, Id>({
    matchRequestResult,
    name,
    sql,
    pg,
  }: {
    name: string;
    sql: (request: Request) => string;
    matchRequestResult: (req: Id[], res: ResponseRaw) => boolean;
    pg: PgDriver;
  }) =>
  (request: Request): Task<DbError | Timeout, Maybe<ResponseRaw>[]> =>
    pg
      .any<ResponseRaw>(sql(request))
      .map((responses) => matchRequestsResults(matchRequestResult, request.pairs, responses))
      .mapRejected(addMeta({ params: request, request: name }));
