import { Option } from 'effect';
import { compose, curryN, filter, find, has, map } from 'ramda';

/**
 * matchFn :: (Request, Result) -> Boolean
 *
 * matchRequestsResults ::
 *  matchFn ->
 *  Request[] ->
 *  Result[] ->
 *  (Option.Option<unknown> Result)[]
 * */
const matchRequestsResults: any = curryN(3, (matchFn, requests, results) => {
  const findResult = compose(Option.fromNullable, (req) =>
    find((res) => matchFn(req, res), results),
  );
  return map(findResult, requests);
});

/**
 * filter :: Query -> QueryWithFilter
 *
 * pickBindFilters ::
 *    { [fName]: fValue -> filter } ->
 *    fName[] ->
 *    { [fName]: fValue } ->
 *    filter[]
 * */
const pickBindFilters: any = curryN(3, (F: any, fsToApply: any, fValues: any) =>
  map(
    (x: any) => F[x](fValues[x]),
    filter((x: any) => has(x, fValues), fsToApply),
  ),
);

/**
 * Escapes query for SQL condition with to_tsquery function
 * @param {string} query
 * @returns {string}
 */
const escapeForTsQuery = (query: string) => {
  return query
    .replace(/[^\w\s]|_/g, '')
    .trim()
    .replace(/\s+/g, ' & ');
};

/**
 * Escapes query for SQL condition with like operator
 * @param {string} query
 * @returns {string}
 */
const escapeForLike = (query: string) => query;

/**
 * Prepares query for SQL condition with like operator
 * @param {string} query
 * @param {object} params
 * @returns {string}
 */
const prepareForLike = (
  query: string,
  params: { matchExactly: boolean } = { matchExactly: false },
) => compose((q: string) => (params.matchExactly ? q : `${q}%`), escapeForLike)(query);

export { escapeForLike, escapeForTsQuery, matchRequestsResults, pickBindFilters, prepareForLike };
