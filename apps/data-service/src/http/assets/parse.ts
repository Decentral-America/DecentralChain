import { Error as error, Ok as ok, type Result } from 'folktale/result';
import { ParseError } from '../../errorHandling';
import {
  type AssetsServiceGetRequest,
  type AssetsServiceMgetRequest,
  type AssetsServiceSearchRequest,
} from '../../services/assets';
import { type FullTextSearch, type SearchByTicker } from '../../services/assets/repo/types';
import { parseFilterValues, withDefaults } from '../_common/filters';
import commonFilters from '../_common/filters/filters';
import { type ParsedFilterValues } from '../_common/filters/types';
import { type HttpRequest } from '../_common/types';

const mgetOrSearchParser = parseFilterValues({
  search: commonFilters.query,
  ticker: commonFilters.query,
});

type ParserFnType = typeof mgetOrSearchParser;

const isMgetRequest = (req: ParsedFilterValues<ParserFnType>): req is AssetsServiceMgetRequest =>
  typeof req.ids !== 'undefined' && Array.isArray(req.ids);

const isSearchByTickerRequest = (req: ParsedFilterValues<ParserFnType>): req is SearchByTicker =>
  typeof req.ticker !== 'undefined';

const isFullTextSearchRequest = (req: ParsedFilterValues<ParserFnType>): req is FullTextSearch =>
  typeof req.search !== 'undefined';

export const get = ({
  params,
}: HttpRequest<['id']>): Result<ParseError, AssetsServiceGetRequest> => {
  if (params) {
    return ok({ id: params.id });
  } else {
    return error(new ParseError(new Error('AssetId is required')));
  }
};

export const mgetOrSearch = ({
  query,
}: HttpRequest): Result<ParseError, AssetsServiceMgetRequest | AssetsServiceSearchRequest> => {
  if (!query) {
    return error(new ParseError(new Error('Query is empty')));
  }

  return mgetOrSearchParser(query).chain((fValues) => {
    if (isMgetRequest(fValues)) {
      return ok(fValues);
    } else {
      const fValuesWithDefaults = withDefaults(fValues);

      if (isSearchByTickerRequest(fValuesWithDefaults)) {
        return ok(fValuesWithDefaults);
      } else if (isFullTextSearchRequest(fValuesWithDefaults)) {
        return ok(fValuesWithDefaults);
      } else {
        return error(new ParseError(new Error('There is neither ticker nor search query')));
      }
    }
  });
};
