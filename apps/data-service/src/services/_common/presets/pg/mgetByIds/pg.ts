import { Effect, type Option, pipe } from 'effect';
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
  (req: Id[]): Effect.Effect<Option.Option<ResponseRaw>[], DbError | Timeout> =>
    isEmpty(req)
      ? Effect.succeed([])
      : pipe(
          pg.any<ResponseRaw>(sql(req)),
          Effect.map(
            (responses) =>
              matchRequestsResults(
                matchRequestResult,
                req,
                responses,
              ) as Option.Option<ResponseRaw>[],
          ),
          Effect.mapError(addMeta({ params: req, request: name })),
        );
