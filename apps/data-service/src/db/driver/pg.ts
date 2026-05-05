// Module transforms pg-promise into pg-task

import { fromPromised, type Task } from 'folktale/concurrency/task';
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
  none(query: SqlQuery, values?: any): Task<DbError | Timeout, null>;
  one<T>(
    query: SqlQuery,
    values?: any,
    cb?: (value: any) => T,
    thisArg?: any,
  ): Task<DbError | Timeout, T>;
  oneOrNone<T>(
    query: SqlQuery,
    values?: any,
    cb?: (value: any) => T,
    thisArg?: any,
  ): Task<DbError | Timeout, T>;
  many<T>(query: SqlQuery, values?: any): Task<DbError | Timeout, T[]>;
  any<T>(query: SqlQuery, values?: any): Task<DbError | Timeout, T[]>;
  task<T>(cb: (t: ITask<{}>) => T | Promise<T>): Task<DbError | Timeout, T>;
  tx<T>(cb: (t: ITask<{}>) => T | Promise<T>): Task<DbError | Timeout, T>;
};

export const createPgDriver = (options: PgDriverOptions, connect = pgpConnect): PgDriver => {
  const driverP: IDatabase<{}> = connect({
    database: options.postgresDatabase,
    host: options.postgresHost,
    max: options.postgresPoolSize, // max connection pool size
    password: options.postgresPassword,
    port: options.postgresPort,
    statement_timeout: defaultTo(false, options.postgresStatementTimeout),
    user: options.postgresUser,
  });

  const toTasked = <T>(promised: () => Promise<T>) =>
    fromPromised<Error, T>(promised)().mapRejected((e) =>
      isStatementTimeoutErrorMessage(e.message) ? toTimeout({}, e) : toDbError({}, e),
    );

  const driverT: PgDriver = {
    any: <T>(query: SqlQuery, values?: any) => toTasked<T[]>(() => driverP.any(query, values)),
    many: <T>(query: SqlQuery, values?: any) => toTasked<T[]>(() => driverP.many(query, values)),
    none: (query: SqlQuery, values?: any) => toTasked(() => driverP.none(query, values)),
    one: <T>(query: SqlQuery, values?: any) => toTasked<T>(() => driverP.one(query, values)),
    oneOrNone: <T>(query: SqlQuery, values?: any) =>
      toTasked<T>(() => driverP.oneOrNone(query, values)),
    task: <T>(cb: (t: ITask<{}>) => T | Promise<T>) => toTasked<T>(() => driverP.task(cb)),
    tx: <T>(cb: (t: ITask<{}>) => T | Promise<T>) => toTasked<T>(() => driverP.tx(cb)),
  };

  return driverT;
};
