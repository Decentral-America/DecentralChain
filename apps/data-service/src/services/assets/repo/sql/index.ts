import { type Knex, knex } from 'knex';
import { isNil, map } from 'ramda';
import { type AssetsSearchRequest, type FullTextSearch, type SearchByTicker } from '../types';
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

  const ticker = (request as Partial<SearchByTicker>).ticker;
  const searchText = (request as Partial<FullTextSearch>).search;

  let baseQuery: Knex.QueryBuilder;
  if (isNil(ticker)) {
    let q = searchAssets(searchText ?? '');
    if (request.after) q = q.clone().where('rn', '>', getAssetIndex(request.after));
    if (request.limit) q = q.clone().limit(request.limit);
    baseQuery = q;
  } else {
    baseQuery = filter(ticker)(pg({ a: 'assets' }).select(map((col) => `a.${col}`, columns)));
  }

  return baseQuery
    .select({
      issue_height: pg.raw('a.issue_height'),
      sender: pg.raw(`a.sender`),
    })
    .toString();
};
