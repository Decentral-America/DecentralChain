import { Effect, type Option, pipe } from 'effect';
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
  (request: Request): Effect.Effect<Option.Option<ResponseRaw>[], DbError | Timeout> =>
    pipe(
      pg.any<ResponseRaw>(sql(request)),
      Effect.map(
        (responses) =>
          matchRequestsResults(
            matchRequestResult,
            request.pairs,
            responses,
          ) as Option.Option<ResponseRaw>[],
      ),
      Effect.mapError(addMeta({ params: request, request: name })),
    );
