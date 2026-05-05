import { Effect, Option, pipe } from 'effect';
import { type PgDriver } from '../../../../../db/driver';
import { addMeta } from '../../../../../errorHandling';

export const getData =
  <ResponseRaw, Id = string>({
    name,
    sql,
    pg,
  }: {
    name: string;
    sql: (id: Id) => string;
    pg: PgDriver;
  }) =>
  (id: Id) =>
    pipe(
      pg.oneOrNone<ResponseRaw>(sql(id)),
      Effect.map(Option.fromNullable),
      Effect.mapError(addMeta({ params: { id }, request: name })),
    );
