import { Either } from 'effect';
import { isNil } from 'ramda';
import { type ParseError } from '../../errorHandling';
import { isSortOrder } from '../../services/_common';
import {
  type PairsMgetRequest,
  type SearchByAssetRequest,
  type SearchByAssetsRequest,
  type SearchCommonRequest,
} from '../../services/pairs/repo/types';
import { parseArrayQuery, parseBool, parsePairs } from '../../utils/parsers';
import { type ParseArrayQuery } from '../../utils/parsers/parseArrayQuery';
import { parseFilterValues } from '../_common/filters';
import commonFilters, { limit } from '../_common/filters/filters';
import { type ParsedFilterValues, type Parser } from '../_common/filters/types';
import { withMatcher } from '../_common/utils';

const PAIRS_MAX_LIMIT = 1000;

export type ParseMatchExactly = Parser<boolean[]>;
export const parseMatchExactly: ParseMatchExactly = (matchExactlyRaw?: string) =>
  isNil(matchExactlyRaw)
    ? Either.right(undefined)
    : Either.flatMap(parseArrayQuery(matchExactlyRaw), (ss) =>
        typeof ss === 'undefined'
          ? Either.right(undefined)
          : ss
              .map(parseBool)
              .reduceRight(
                (acc: Either.Either<boolean[], ParseError>, cur) =>
                  Either.flatMap(acc, (a) =>
                    Either.isLeft(cur)
                      ? Either.left(cur.left)
                      : cur.right === undefined
                        ? Either.right(a)
                        : Either.right([...a, cur.right]),
                  ),
                Either.right<boolean[]>([]),
              ),
      );

export const mgetOrSearchParser = parseFilterValues({
  limit: limit(PAIRS_MAX_LIMIT),
  match_exactly: parseMatchExactly,
  matcher: commonFilters.query,
  pairs: parsePairs,
  search_by_asset: commonFilters.query,
  search_by_assets: parseArrayQuery as ParseArrayQuery,
});

type ParserFnType = typeof mgetOrSearchParser;

export const isMgetRequest = (req: ParsedFilterValues<ParserFnType>): req is PairsMgetRequest =>
  'pairs' in req && Array.isArray(req.pairs) && withMatcher(req);

export const isSearchCommonRequest = (
  req: ParsedFilterValues<ParserFnType>,
): req is SearchCommonRequest =>
  'matcher' in req &&
  typeof req.matcher === 'string' &&
  'limit' in req &&
  typeof req.limit === 'number' &&
  'sort' in req &&
  isSortOrder(req.sort);

export const isSearchByAssetRequest = (
  req: ParsedFilterValues<ParserFnType>,
): req is SearchByAssetRequest =>
  'search_by_asset' in req &&
  typeof req.search_by_asset === 'string' &&
  'match_exactly' in req &&
  Array.isArray(req.match_exactly) &&
  req.match_exactly.length === 1;

export const isSearchByAssetsRequest = (
  req: ParsedFilterValues<ParserFnType>,
): req is SearchByAssetsRequest =>
  'search_by_assets' in req &&
  Array.isArray(req.search_by_assets) &&
  req.search_by_assets.length === 2 &&
  'match_exactly' in req &&
  Array.isArray(req.match_exactly) &&
  req.match_exactly.length === 2;
