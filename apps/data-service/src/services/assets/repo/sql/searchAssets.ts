import { type Knex, knex } from 'knex';
import { map } from 'ramda';
import { escapeForTsQuery, prepareForLike } from '../../../../utils/db';
import { columns } from './common';

const pg = knex({ client: 'pg' });

const searchById = (q: string) =>
  pg({ a: 'assets' })
    .columns({
      asset_id: `a.${columns.asset_id}`,
      asset_name: `a.${columns.asset_name}`,
      height: `a.${columns.issue_height}`,
      rank: pg.raw(
        `ts_rank(to_tsvector('simple', a.${columns.asset_id}), plainto_tsquery(?), 3) * case when a.${columns.ticker} is null then 128 else 256 end`,
        [q],
      ),
      ticker: `a.${columns.ticker}`,
    })
    .where(`a.${columns.asset_id}`, 'ilike', prepareForLike(q, { matchExactly: true })); // case-insensitive match for asset IDs

const searchByNameInMeta = (qb: Knex.QueryBuilder, q: string) =>
  qb
    .table('assets_metadata')
    .columns([
      'asset_id',
      'asset_name',
      'height',
      {
        rank: pg.raw(
          "ts_rank(to_tsvector('simple', asset_name), plainto_tsquery(?), 3) * case when ticker is null then 64 else 128 end",
          [q],
        ),
      },
      'ticker',
    ])
    .where('asset_name', 'ilike', prepareForLike(q));

const searchByTicker = (qb: Knex.QueryBuilder, q: string): Knex.QueryBuilder =>
  qb
    .table({ a: 'assets' })
    .columns({
      asset_id: `a.${columns.asset_id}`,
      asset_name: `a.${columns.asset_name}`,
      height: `a.${columns.issue_height}`,
      rank: pg.raw('32'),
      ticker: `a.${columns.ticker}`,
    })
    .where(`a.${columns.ticker}`, 'ilike', prepareForLike(q));

const searchByName = (qb: Knex.QueryBuilder, q: string) => {
  const cleanedQuery = escapeForTsQuery(q);
  const base = qb
    .table({ a: 'assets' })
    .columns({
      asset_id: `a.${columns.asset_id}`,
      asset_name: `a.${columns.asset_name}`,
      height: `a.${columns.issue_height}`,
      rank: pg.raw(
        `ts_rank(to_tsvector('simple', a.${columns.asset_name}), plainto_tsquery(?), 3) * case when a.${columns.ticker} is null then 16 else 32 end`,
        [q],
      ),
      ticker: `a.${columns.ticker}`,
    })
    .where(`a.${columns.asset_name}`, 'ilike', prepareForLike(q));
  return cleanedQuery.length
    ? base.orWhereRaw(`to_tsvector('simple', a.asset_name) @@ to_tsquery(?)`, [`${cleanedQuery}:*`])
    : base;
};

export const searchAssets = (query: string): Knex.QueryBuilder =>
  pg
    .with('assets_cte', (qb) => {
      qb.select([
        pg.raw('distinct on ("r"."asset_id") "r"."asset_id"'),
        'r.ticker',
        'r.asset_name',
        {
          rn: pg.raw('row_number() over (order by r.rank desc, r.height asc, r.asset_id asc)'),
        },
      ])
        .from({
          r: searchById(query)
            .unionAll((qb) => searchByNameInMeta(qb, query))
            .unionAll((qb) => searchByTicker(qb, query))
            .unionAll((qb) => searchByName(qb, query)),
        } as unknown as string)
        .orderBy('r.asset_id')
        .orderBy('r.rank', 'desc');
    })
    .from('assets_cte')
    .select(map((col) => `a.${col}`, columns))
    .innerJoin({ a: 'assets' }, 'assets_cte.asset_id', 'a.asset_id')
    .orderBy('rn', 'asc');
