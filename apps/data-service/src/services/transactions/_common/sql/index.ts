import { knex as _knex, type Knex } from 'knex';
import { compose, filter, has, identity, map, pick, reverse } from 'ramda';
import * as defaultValues from './defaults';
import commonFilters from './filters';
import commonFiltersOrder from './filtersOrder';

const pg = _knex({ client: 'pg' });

const createSql = ({
  query,
  filters = commonFilters,
  filtersOrder = commonFiltersOrder,
  queryAfterFilters = {} as Record<string, unknown>,
}: {
  query: any;
  filters?: Partial<typeof commonFilters> & Record<string, any>;
  filtersOrder?: string[];
  queryAfterFilters?: Record<string, unknown>;
}) => {
  const queryAfterFiltersWithDefaults: Record<string, (q: unknown, params?: unknown) => unknown> = {
    get: identity as (q: unknown) => unknown,
    mget: identity as (q: unknown) => unknown,
    search: identity as (q: unknown) => unknown,
    ...(queryAfterFilters as Record<string, (q: unknown, params?: unknown) => unknown>),
  };

  return {
    get: (id: unknown) =>
      (compose as any)(
        String,
        (q: unknown) => queryAfterFiltersWithDefaults['get']?.(q, id),
        (filters as any).limit(1),
        (filters as any).id(id as string),
      )(query),

    mget: (ids: unknown[]) =>
      (compose as any)(
        String,
        (q: unknown) => queryAfterFiltersWithDefaults['mget']?.(q, ids),
        (filters as any).sort(defaultValues.SORT),
        (filters as any).limit(ids.length),
        (filters as any).ids(ids as string[]),
      )(query),

    search: (fValues: Record<string, unknown>) => {
      const fValuesPicked = pick(filtersOrder, fValues);
      const appliedFs = (compose as any)(
        map((x: string) =>
          (filters as Record<string, (v: unknown) => (q: unknown) => unknown>)[x]?.(
            fValuesPicked[x],
          ),
        ),
        filter((x: string) => has(x, fValuesPicked)),
        reverse,
      )(filtersOrder) as Array<(q: unknown) => unknown>;

      return (compose as any)(
        String,
        (q: unknown) => queryAfterFiltersWithDefaults['search']?.(q, fValuesPicked),
        ...(appliedFs as Array<(q: unknown) => unknown>),
        (q: { clone: () => unknown }) => q.clone(),
      )(query);
    },
  };
};

const createByTimeStamp =
  (t: string) => (comparator: string) => (ts: Date) => (q: Knex.QueryBuilder) =>
    q
      .clone()
      .where(
        't.uid',
        comparator,
        pg(t)
          .select('uid')
          .where('time_stamp', comparator, ts.toISOString())
          .orderByRaw(`time_stamp <-> '${ts.toISOString()}'::timestamptz`)
          .limit(1),
      );

const createByBlockTimeStamp =
  (t: string) => (comparator: string) => (ts: Date) => (q: Knex.QueryBuilder) =>
    q.clone().where(
      't.uid',
      comparator,
      pg(t)
        .select('uid')
        .where(
          'height',
          comparator,
          pg('blocks')
            .select('height')
            .where('time_stamp', comparator, ts.toISOString())
            .orderByRaw(`time_stamp <-> '${ts.toISOString()}'::timestamptz`)
            .limit(1),
        )
        .orderBy('height', comparator === '>=' ? 'asc' : 'desc')
        .limit(1),
    );

export { createByBlockTimeStamp, createByTimeStamp, createSql, defaultValues };
