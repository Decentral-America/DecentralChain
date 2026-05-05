import { Effect, pipe } from 'effect';
import { type IDatabase, type ITask } from 'pg-promise';
import { defaultTo } from 'ramda';
import { type DbError, type Timeout, toDbError, toTimeout } from '../../errorHandling';
import { pgpConnect } from './pgp';
import { isStatementTimeoutErrorMessage } from './utils';

export type PgDriverOptions = {
  postgresHost: string;
  postgresPort: number;
  postgresDatabase: string;
  postgresUser: string;
  postgresPassword: string;
  postgresPoolSize: number;
  postgresStatementTimeout?: number | false;
};

export type SqlQuery = string;

export type PgDriver = {
  none(query: SqlQuery, values?: any): Effect.Effect<null, DbError | Timeout>;
  one<T>(
    query: SqlQuery,
    values?: any,
    cb?: (value: any) => T,
    thisArg?: any,
  ): Effect.Effect<T, DbError | Timeout>;
  oneOrNone<T>(
    query: SqlQuery,
    values?: any,
    cb?: (value: any) => T,
    thisArg?: any,
  ): Effect.Effect<T | null, DbError | Timeout>;
  many<T>(query: SqlQuery, values?: any): Effect.Effect<T[], DbError | Timeout>;
  any<T>(query: SqlQuery, values?: any): Effect.Effect<T[], DbError | Timeout>;
  task<T>(cb: (t: ITask<object>) => T | Promise<T>): Effect.Effect<T, DbError | Timeout>;
  tx<T>(cb: (t: ITask<object>) => T | Promise<T>): Effect.Effect<T, DbError | Timeout>;
};

export const createPgDriver = (options: PgDriverOptions, connect = pgpConnect): PgDriver => {
  const driverP: IDatabase<object> = connect({
    database: options.postgresDatabase,
    host: options.postgresHost,
    max: options.postgresPoolSize,
    password: options.postgresPassword,
    port: options.postgresPort,
    statement_timeout: defaultTo(false, options.postgresStatementTimeout),
    user: options.postgresUser,
  });

  const toEffectful = <T>(promised: () => Promise<T>): Effect.Effect<T, DbError | Timeout> =>
    pipe(
      Effect.tryPromise({ catch: (e) => e as Error, try: promised }),
      Effect.mapError((e) =>
        isStatementTimeoutErrorMessage(e.message) ? toTimeout({}, e) : toDbError({}, e),
      ),
    );

  return {
    any: <T>(query: SqlQuery, values?: any) => toEffectful<T[]>(() => driverP.any(query, values)),
    many: <T>(query: SqlQuery, values?: any) => toEffectful<T[]>(() => driverP.many(query, values)),
    none: (query: SqlQuery, values?: any) => toEffectful(() => driverP.none(query, values)),
    one: <T>(query: SqlQuery, values?: any) => toEffectful<T>(() => driverP.one(query, values)),
    oneOrNone: <T>(query: SqlQuery, values?: any) =>
      toEffectful<T | null>(() => driverP.oneOrNone(query, values)),
    task: <T>(cb: (t: ITask<object>) => T | Promise<T>) => toEffectful<T>(() => driverP.task(cb)),
    tx: <T>(cb: (t: ITask<object>) => T | Promise<T>) => toEffectful<T>(() => driverP.tx(cb)),
  };
};
