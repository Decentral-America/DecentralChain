import { knex as _knex, type Knex } from 'knex';
import { has, identity, pick } from 'ramda';
import * as defaultValues from './defaults';
import commonFilters from './filters';
import commonFiltersOrder from './filtersOrder';

const pg = _knex({ client: 'pg' });

type FilterFn = (v: unknown) => (q: unknown) => unknown;
type FiltersMap = Record<string, FilterFn>;

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
  const f = filters as FiltersMap;
  const queryAfterFiltersWithDefaults: Record<string, (q: unknown, params?: unknown) => unknown> = {
    get: identity as (q: unknown) => unknown,
    mget: identity as (q: unknown) => unknown,
    search: identity as (q: unknown) => unknown,
    ...(queryAfterFilters as Record<string, (q: unknown, params?: unknown) => unknown>),
  };

  return {
    get: (id: unknown) => {
      let q: unknown = f['id']?.(id as string)(query) ?? query;
      q = f['limit']?.(1)(q) ?? q;
      q = queryAfterFiltersWithDefaults['get']?.(q, id) ?? q;
      return String(q);
    },

    mget: (ids: unknown[]) => {
      let q: unknown = f['ids']?.(ids as string[])(query) ?? query;
      q = f['limit']?.(ids.length)(q) ?? q;
      q = f['sort']?.(defaultValues.SORT)(q) ?? q;
      q = queryAfterFiltersWithDefaults['mget']?.(q, ids) ?? q;
      return String(q);
    },

    search: (fValues: Record<string, unknown>) => {
      const fValuesPicked = pick(filtersOrder, fValues);
      const appliedFs: Array<(q: unknown) => unknown> = filtersOrder
        .filter((x) => has(x, fValuesPicked))
        .map((x) => f[x]?.(fValuesPicked[x]) ?? identity);

      let q: unknown = (query as { clone: () => unknown }).clone();
      for (const fn of appliedFs) {
        q = fn(q);
      }
      q = queryAfterFiltersWithDefaults['search']?.(q, fValuesPicked) ?? q;
      return String(q);
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
