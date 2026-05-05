import { Effect, pipe } from 'effect';
import { type PgDriver } from '../../../../../db/driver';
import { addMeta } from '../../../../../errorHandling';

export const getData =
  <Request, ResponseRaw>({
    name,
    sql,
    pg,
  }: {
    name: string;
    sql: (req: Request) => string;
    pg: PgDriver;
  }) =>
  (request: Request) =>
    pipe(
      pg.any<ResponseRaw>(sql(request)),
      Effect.mapError(addMeta({ params: request, request: name })),
    );
