import { type Knex, knex } from 'knex';
import { complement, compose, cond, isNil, map } from 'ramda';
import { type AssetsSearchRequest } from '../types';
import { columns } from './common';
import { searchAssets } from './searchAssets';

const pg = knex({ client: 'pg' });

const getAssetIndex = (asset_id: string) =>
  pg('assets_cte').column('rn').where('asset_id', asset_id);

export const mget = (ids: string[]): string =>
  pg({ a: 'assets' })
    .select(map((col) => `a.${col}`, columns))
    .select({
      issue_height: pg.raw('a.issue_height'),
      sender: pg.raw(`a.sender`),
    })
    .whereIn('asset_id', ids)
    .toString();

export const get = (id: string): string => mget([id]);

export const search = (request: AssetsSearchRequest): string => {
  const filter = (ticker: string) => (q: Knex.QueryBuilder) => {
    if (ticker === '*') return q.whereNotNull('ticker').andWhere('ticker', '<>', '');
    else return q.where('ticker', ticker);
  };

  return compose(
    (q: Knex.QueryBuilder) => q.toString(),
    (q: Knex.QueryBuilder) =>
      q.select({
        issue_height: pg.raw('a.issue_height'),
        sender: pg.raw(`a.sender`),
      }),
    (request: AssetsSearchRequest) =>
      (cond as any)([
        [
          (r: AssetsSearchRequest) => isNil((r as any).ticker),
          (r: AssetsSearchRequest) =>
            compose(
              (q: Knex.QueryBuilder) => (r.limit ? q.clone().limit(r.limit) : q),
              (q: Knex.QueryBuilder) =>
                r.after ? q.clone().where('rn', '>', getAssetIndex(r.after)) : q,
            )(searchAssets((r as any).search)),
        ],
        [
          complement(isNil),
          (r: AssetsSearchRequest) =>
            filter((r as any).ticker)(
              pg({ a: 'assets' }).select(map((col: any) => `a.${col}`, columns)),
            ),
        ],
      ])(request),
  )(request);
};
