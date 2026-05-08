import { Effect } from 'effect';
import type postgres from 'postgres';
import { createPgDriver, type PgDriverOptions } from '../driver';

// ---------------------------------------------------------------------------
// Minimal postgres.Sql mock for unit-testing the Effect wrappers.
// The mock accepts a `rows` factory so each test controls what the DB returns.
// ---------------------------------------------------------------------------
type MockRow = Record<string, unknown>;

const makeMockSql = (getRows: () => MockRow[]): postgres.Sql =>
  ({
    begin: <T>(cb: (t: postgres.TransactionSql) => T | Promise<T>) =>
      Promise.resolve(cb({} as postgres.TransactionSql)),
    unsafe: () => {
      const rows = getRows();
      // Return a thenable that also exposes .then() — mirrors RowList<T>
      return Object.assign(Promise.resolve(rows), { count: rows.length });
    },
  }) as unknown as postgres.Sql;

const makeDriver = (rows: MockRow[]) =>
  createPgDriver(
    {} as PgDriverOptions,
    makeMockSql(() => rows),
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('PgDriver — none', () => {
  test('returns null regardless of DB rows', async () => {
    const result = await Effect.runPromise(makeDriver([{ x: 1 }]).none('SELECT 1'));
    expect(result).toBeNull();
  });
});

describe('PgDriver — any', () => {
  test('returns empty array when no rows', async () => {
    expect(await Effect.runPromise(makeDriver([]).any('SELECT *'))).toEqual([]);
  });

  test('returns all rows', async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    expect(await Effect.runPromise(makeDriver(rows).any('SELECT *'))).toEqual(rows);
  });
});

describe('PgDriver — many', () => {
  test('returns rows when present', async () => {
    const rows = [{ id: 1 }];
    expect(await Effect.runPromise(makeDriver(rows).many('SELECT *'))).toEqual(rows);
  });

  test('fails with DbError when no rows', async () => {
    const result = await Effect.runPromise(Effect.either(makeDriver([]).many('SELECT *')));
    expect(result._tag).toBe('Left');
  });
});

describe('PgDriver — one', () => {
  test('returns the single row', async () => {
    const row = { id: 42 };
    expect(await Effect.runPromise(makeDriver([row]).one('SELECT *'))).toEqual(row);
  });

  test('fails when no rows', async () => {
    const result = await Effect.runPromise(Effect.either(makeDriver([]).one('SELECT *')));
    expect(result._tag).toBe('Left');
  });

  test('fails when more than one row', async () => {
    const result = await Effect.runPromise(
      Effect.either(makeDriver([{ id: 1 }, { id: 2 }]).one('SELECT *')),
    );
    expect(result._tag).toBe('Left');
  });
});

describe('PgDriver — oneOrNone', () => {
  test('returns row when present', async () => {
    const row = { id: 1 };
    expect(await Effect.runPromise(makeDriver([row]).oneOrNone('SELECT *'))).toEqual(row);
  });

  test('returns null when absent', async () => {
    expect(await Effect.runPromise(makeDriver([]).oneOrNone('SELECT *'))).toBeNull();
  });

  test('fails when more than one row', async () => {
    const result = await Effect.runPromise(
      Effect.either(makeDriver([{ id: 1 }, { id: 2 }]).oneOrNone('SELECT *')),
    );
    expect(result._tag).toBe('Left');
  });
});

describe('PgDriver — task', () => {
  test('invokes callback and returns its result', async () => {
    const result = await Effect.runPromise(makeDriver([]).task(async () => 'task_result'));
    expect(result).toBe('task_result');
  });
});

describe('PgDriver — tx', () => {
  test('invokes callback and returns its result', async () => {
    const result = await Effect.runPromise(makeDriver([]).tx(async () => 'tx_result'));
    expect(result).toBe('tx_result');
  });
});
