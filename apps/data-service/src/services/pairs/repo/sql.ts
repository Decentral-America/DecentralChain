import { type Knex, knex } from 'knex';
import { compose } from 'ramda';
import { type AssetIdsPair } from '../../../types';
import { escapeForTsQuery, prepareForLike } from '../../../utils/db';
import {
  type PairsGetRequest,
  type PairsMgetRequest,
  type PairsSearchRequest,
  type SearchByAssetRequest,
  type SearchByAssetsRequest,
} from './types';

const pg = knex({ client: 'pg' });

const COLUMNS = [
  'first_price',
  'last_price',
  'volume',
  'quote_volume',
  'high',
  'low',
  'weighted_average_price',
  'txs_count',
  'volume_waves',
  'amount_asset_id',
  'price_asset_id',
];

const isSearchByAssetRequest = (req: PairsSearchRequest): req is SearchByAssetRequest => {
  return 'search_by_asset' in req && typeof req.search_by_asset === 'string';
};

const isSearchByAssetsRequest = (req: PairsSearchRequest): req is SearchByAssetsRequest => {
  return (
    'search_by_assets' in req &&
    Array.isArray(req.search_by_assets) &&
    req.search_by_assets.length === 2
  );
};

const getMatchExactly = (matchExactly: boolean[] | undefined): [boolean, boolean] => {
  const DEFAULT_MATCH_EXACTLY = false;

  if (typeof matchExactly === 'undefined') {
    return [DEFAULT_MATCH_EXACTLY, DEFAULT_MATCH_EXACTLY];
  } else {
    if (matchExactly.length === 1) {
      return [matchExactly[0] as boolean, matchExactly[0] as boolean];
    } else {
      return [matchExactly[0] as boolean, matchExactly[1] as boolean];
    }
  }
};

const query = (pairs: AssetIdsPair[], matcher: string): string =>
  pg({ t: 'pairs' })
    .select(COLUMNS)
    .whereIn(
      ['t.amount_asset_id', 't.price_asset_id'],
      pairs.map((pair) => [pair.amountAsset, pair.priceAsset]),
    )
    .where('matcher_address', matcher)
    .toString();

const searchAssets = (
  qb: Knex.QueryBuilder,
  query: string,
  matchExactly: boolean,
  tableAlias: string = 't',
) => {
  // will be used on to_tsvector('simple', asset_name) search
  const cleanedQuery = escapeForTsQuery(query);
  return (qb.distinct('asset_id') as unknown as Knex.QueryBuilder).from(function (
    this: Knex.QueryBuilder,
  ) {
    return (this as unknown as Knex.QueryBuilder)
      .table({ [tableAlias]: 'assets' })
      .column({ asset_id: `${tableAlias}.asset_id` })
      .where(`${tableAlias}.asset_id`, query)
      .orWhere(`${tableAlias}.ticker`, 'ilike', prepareForLike(query, { matchExactly }))
      .unionAll((q: any) =>
        q
          .from({ [`${tableAlias}2`]: 'assets_metadata' })
          .column({ asset_id: `${tableAlias}2.asset_id` })
          .where(`${tableAlias}2.asset_name`, 'ilike', prepareForLike(query, { matchExactly })),
      )
      .unionAll((q: any) =>
        compose((q: Knex.QueryBuilder) =>
          cleanedQuery.length
            ? q.orWhereRaw(`to_tsvector('simple', ${tableAlias}3.asset_name) @@ to_tsquery(?)`, [
                `${cleanedQuery}:*`,
              ])
            : q,
        )(
          q
            .from({ [`${tableAlias}3`]: 'assets' })
            .column({ asset_id: `${tableAlias}3.asset_id` })
            .where(`${tableAlias}3.asset_name`, 'ilike', prepareForLike(query, { matchExactly })),
        ),
      )
      .as('a');
  });
};

export const get = (r: PairsGetRequest): string => query([r.pair], r.matcher);
export const mget = (r: PairsMgetRequest): string => query(r.pairs, r.matcher);
export const search = (req: PairsSearchRequest): string => {
  // asset - prefix search of amount or price assets
  // asset1/asset2 - prefix search of amount asset by asset1
  //                 and prefix search of price asset by asset2
  //                 or amount asset by asset2 and price asset by asset1

  const { matcher, limit } = req;
  const q = pg({ t: 'pairs' })
    .select(COLUMNS.map((column) => `t.${column}`))
    .orderByRaw('volume_waves desc NULLS LAST')
    .where('matcher_address', matcher)
    .limit(limit);
  if (isSearchByAssetRequest(req)) {
    const { search_by_asset: amountAsset, match_exactly: matchExactly } = req;
    return q
      .with('assets_cte', (qb: Knex.QueryBuilder) =>
        searchAssets(qb, amountAsset, getMatchExactly(matchExactly)[0]),
      )
      .innerJoin({ amount_cte: 'assets_cte' }, 'amount_cte.asset_id', 't.amount_asset_id')
      .innerJoin({ price_cte: 'assets_cte' }, 'price_cte.asset_id', 't.amount_asset_id')
      .toString();
  } else if (isSearchByAssetsRequest(req)) {
    const [amountAsset, priceAsset] = req.search_by_assets;

    const [amountAssetExactly, priceAssetExaclty] = getMatchExactly(req.match_exactly);

    return q
      .with('assets_cte', (qb: Knex.QueryBuilder) =>
        (qb as unknown as Knex.QueryBuilder)
          .from({
            t1: searchAssets(pg.queryBuilder(), amountAsset, amountAssetExactly, 'a'),
            t2: searchAssets(pg.queryBuilder(), priceAsset, priceAssetExaclty, 'p'),
          } as unknown as string)
          .columns({
            amount_asset_id: 't1.asset_id',
            price_asset_id: 't2.asset_id',
          }),
      )
      .join(
        { direct_cte: 'assets_cte' },
        {
          'direct_cte.amount_asset_id': 't.amount_asset_id',
          'direct_cte.price_asset_id': 't.price_asset_id',
        },
      )
      .unionAll((qb: Knex.QueryBuilder) =>
        qb
          .select(COLUMNS.map((column) => `t1.${column}`))
          .from({ t1: 'pairs' })
          .join(
            { reverse_cte: 'assets_cte' },
            {
              'reverse_cte.amount_asset_id': 't1.price_asset_id',
              'reverse_cte.price_asset_id': 't1.amount_asset_id',
            },
          )
          .where('matcher_address', matcher),
      )
      .toString();
  } else {
    return q.toString();
  }
};
