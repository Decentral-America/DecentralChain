import { type Knex, knex } from 'knex';
import { complement, compose } from 'ramda';
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

const baseQuery = (qb: Knex.QueryBuilder) => (qb.from({ t: 'txs_10' }) as any).select('t.uid');

const selectAfterFilters = (filtered: Knex.QueryBuilder) =>
  (pg.select(columns) as any).from({ a: filtered });

const filterByAliases = (qb: Knex.QueryBuilder, aliasSet: string[]) =>
  qb.whereIn('t.alias', aliasSet);

const selectFilteredAliases = (filtered: Knex.QueryBuilder) =>
  (pg as any).from({
    counted_aliases: pg({ t: 'txs_10' })
      .select('t.alias')
      .min({ address: 't.sender' }) // first sender
      .count({ duplicates: 't.sender' }) // count senders grouped by alias
      .column({ rn: pg.raw('row_number() over (order by min(t.uid))') }) // rn for pagination
      .whereIn('t.uid', filtered)
      .groupBy('t.alias'),
  });

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

    return (compose as any)(
      // aliases are considered broken if 'duplicates' not equal to 1
      (q: Knex.QueryBuilder) =>
        req.showBroken ? q.toString() : q.clone().where('duplicates', 1).toString(),
      (q: Knex.QueryBuilder) => (req.after ? q.where('rn', '>', getAliasRowNumber(req.after)) : q),
    )(q);
  },
};
