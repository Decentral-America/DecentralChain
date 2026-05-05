import { fromNullable } from 'folktale/maybe';
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
    pg
      .oneOrNone<ResponseRaw>(sql(id))
      .map(fromNullable)
      .mapRejected(addMeta({ params: { id }, request: name }));
