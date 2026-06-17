import { type Knex, knex } from 'knex';
import { complement } from 'ramda';
import {
  type AliasesSearchRequest,
  type WithAddress,
  type WithAddresses,
  type WithQueries,
} from '../../repo';

const pg = knex({ client: 'pg' });

const columns = ['alias', 'address', 'duplicates'];
const columnsWithRowNumber = [...columns, 'rn'];

// address has 31 <= length <= 45
// alias has 4 <= length <= 15
const minAddressLength = 31;
const isAddress = (addressOrAlias: string) => addressOrAlias.length >= minAddressLength;

const getAliasRowNumber = (after: string) => pg('aliases_cte').select('rn').where('alias', after);

const baseQuery = (qb: Knex.QueryBuilder) =>
  qb.from({ t: 'txs_10' } as unknown as string).select('t.uid');

const selectAfterFilters = (filtered: Knex.QueryBuilder) =>
  pg.select(columns).from({ a: filtered } as unknown as string);

const filterByAliases = (qb: Knex.QueryBuilder, aliasSet: string[]) =>
  qb.whereIn('t.alias', aliasSet);

const selectFilteredAliases = (filtered: Knex.QueryBuilder) =>
  pg.queryBuilder().from({
    counted_aliases: pg({ t: 'txs_10' })
      .select('t.alias')
      .min({ address: 't.sender' }) // first sender
      .column(pg.raw('COUNT("t"."sender")::bigint AS "duplicates"')) // cast to bigint for BigNumber schema
      .column({ rn: pg.raw('row_number() over (order by min(t.uid))') }) // rn for pagination
      .whereIn('t.uid', filtered)
      .groupBy('t.alias'),
  } as unknown as string);

const withAddress = (req: AliasesSearchRequest): req is AliasesSearchRequest & WithAddress =>
  typeof req.address === 'string';

const withAddresses = (req: AliasesSearchRequest): req is AliasesSearchRequest & WithAddresses =>
  Array.isArray(req.addresses);

const withQueries = (req: AliasesSearchRequest): req is AliasesSearchRequest & WithQueries =>
  Array.isArray(req.queries);

export default {
  get: (alias: string) =>
    selectAfterFilters(
      selectFilteredAliases(filterByAliases(baseQuery(pg.queryBuilder()), [alias])),
    )
      .clone()
      .toString(),
  mget: (aliases: string[]) =>
    selectAfterFilters(
      selectFilteredAliases(filterByAliases(baseQuery(pg.queryBuilder()), aliases)),
    )
      .clone()
      .toString(),
  search: (req: AliasesSearchRequest) => {
    const query = baseQuery(pg.queryBuilder());

    let aliases: string[] = [];

    if (withAddress(req)) {
      query.where('sender', req.address);
    } else if (withAddresses(req)) {
      query.whereIn('sender', req.addresses);
    } else if (withQueries(req)) {
      query.whereIn('sender', req.queries.filter(isAddress));
      aliases = req.queries.filter(complement(isAddress));
      query.unionAll((qb: Knex.QueryBuilder) => filterByAliases(baseQuery(qb), aliases));
    }

    const q = selectAfterFilters(
      pg('aliases_cte').with(
        'aliases_cte',
        selectFilteredAliases(query).distinct().select(columnsWithRowNumber),
      ),
    )
      .orderBy('rn', 'asc')
      .limit(req.limit);

    const withAfter = req.after ? q.where('rn', '>', getAliasRowNumber(req.after)) : q;
    // aliases are considered broken if 'duplicates' not equal to 1
    return req.showBroken
      ? withAfter.toString()
      : withAfter.clone().where('duplicates', 1).toString();
  },
};
