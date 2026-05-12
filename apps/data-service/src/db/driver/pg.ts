import { type BigNumber } from '@decentralchain/data-entities';
import { Effect, pipe } from 'effect';
import postgres from 'postgres';

import { type DbError, type Timeout, toDbError, toTimeout } from '../../errorHandling';
import { toBigNumber } from '../../utils/bigNumber';
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
  none(query: SqlQuery): Effect.Effect<null, DbError | Timeout>;
  one<T>(query: SqlQuery): Effect.Effect<T, DbError | Timeout>;
  oneOrNone<T>(query: SqlQuery): Effect.Effect<T | null, DbError | Timeout>;
  many<T>(query: SqlQuery): Effect.Effect<T[], DbError | Timeout>;
  any<T>(query: SqlQuery): Effect.Effect<T[], DbError | Timeout>;
  task<T>(cb: (t: postgres.TransactionSql) => T | Promise<T>): Effect.Effect<T, DbError | Timeout>;
  tx<T>(cb: (t: postgres.TransactionSql) => T | Promise<T>): Effect.Effect<T, DbError | Timeout>;
};

// BigNumber custom type parser shared across all three numeric OIDs.
// postgres.js automatically applies the element parser when resolving array
// results (e.g. OID 1016 = _int8), so only the scalar OID is listed in `from`.
const bigNumberType = (to: number, from: number[]): postgres.PostgresType<BigNumber> => ({
  from,
  parse: (v: string): BigNumber => toBigNumber(v),
  serialize: (v: BigNumber) => v.toString(),
  to,
});

// The generic parameter carries the custom type map. postgres.Sql<{}> is what
// we get when T extends Record<string, PostgresType> is the full map, but we
// only need runtime behavior from the types — the tagged-template generic
// inference is unused here because all queries go through sql.unsafe().
type AnyTypes = Record<string, postgres.PostgresType>;

const buildSqlOptions = (options: PgDriverOptions): postgres.Options<AnyTypes> => {
  const base: postgres.Options<AnyTypes> = {
    database: options.postgresDatabase,
    host: options.postgresHost,
    max: options.postgresPoolSize,
    password: options.postgresPassword,
    port: options.postgresPort,
    ssl: true,
    types: {
      bigint: bigNumberType(20, [20]), // int8
      float8: bigNumberType(701, [701]), // float8 / double precision
      numeric: bigNumberType(1700, [1700]), // numeric / decimal
    },
    user: options.postgresUser,
  };

  // statement_timeout is sent as a session-level parameter on connect.
  // Only set when the value is a positive number (false = no timeout).
  if (
    options.postgresStatementTimeout !== false &&
    options.postgresStatementTimeout !== undefined
  ) {
    base.connection = { statement_timeout: options.postgresStatementTimeout };
  }

  return base;
};

export const createPgDriver = (
  options: PgDriverOptions,
  // For unit testing only — inject a ready-made postgres.Sql instance.
  // Production always creates the connection from options internally.
  sqlOverride?: postgres.Sql,
): PgDriver => {
  const sql: postgres.Sql = sqlOverride ?? postgres(buildSqlOptions(options));

  const toEffectful = <T>(promised: () => Promise<T>): Effect.Effect<T, DbError | Timeout> =>
    pipe(
      Effect.tryPromise({ catch: (e) => e as Error, try: promised }),
      Effect.mapError((e: Error) =>
        isStatementTimeoutErrorMessage(e.message) ? toTimeout({}, e) : toDbError({}, e),
      ),
    );

  // run :: SqlQuery -> Promise<unknown[]>
  // Uses sql.unsafe() since all queries are pre-built SQL strings from knex.
  // Typed as any[] internally to avoid RowList<Row[]> index-signature noise
  // under noUncheckedIndexedAccess + exactOptionalPropertyTypes.
  const run = (query: SqlQuery): Promise<any[]> => sql.unsafe(query) as unknown as Promise<any[]>;

  return {
    any: <T>(query: SqlQuery) =>
      toEffectful<T[]>(async () => {
        const rows = await run(query);
        return rows as T[];
      }),

    many: <T>(query: SqlQuery) =>
      toEffectful<T[]>(async () => {
        const rows = await run(query);
        if (rows.length === 0) {
          throw new Error('Expected at least 1 row, got 0');
        }
        return rows as T[];
      }),
    none: (query: SqlQuery) => toEffectful(() => run(query).then(() => null)),

    one: <T>(query: SqlQuery) =>
      toEffectful<T>(async () => {
        const rows = await run(query);
        if (rows.length !== 1) {
          throw new Error(`Expected exactly 1 row, got ${rows.length}`);
        }
        return rows[0] as T;
      }),

    oneOrNone: <T>(query: SqlQuery) =>
      toEffectful<T | null>(async () => {
        const rows = await run(query);
        if (rows.length > 1) {
          throw new Error(`Expected at most 1 row, got ${rows.length}`);
        }
        return rows.length === 1 ? (rows[0] as T) : null;
      }),

    // postgres.js has no non-transactional "task" primitive; sql.begin() is
    // the closest equivalent and is strictly safer for batch operations.
    task: <T>(cb: (t: postgres.TransactionSql) => T | Promise<T>) =>
      toEffectful<T>(() => sql.begin(cb) as unknown as Promise<T>),

    tx: <T>(cb: (t: postgres.TransactionSql) => T | Promise<T>) =>
      toEffectful<T>(() => sql.begin(cb) as unknown as Promise<T>),
  };
};
