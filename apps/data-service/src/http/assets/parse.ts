import { Either } from 'effect';
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
}: HttpRequest<['id']>): Either.Either<AssetsServiceGetRequest, ParseError> => {
  if (params) {
    return Either.right({ id: params.id });
  } else {
    return Either.left(new ParseError(new Error('AssetId is required')));
  }
};

export const mgetOrSearch = ({
  query,
}: HttpRequest): Either.Either<
  AssetsServiceMgetRequest | AssetsServiceSearchRequest,
  ParseError
> => {
  if (!query) {
    return Either.left(new ParseError(new Error('Query is empty')));
  }

  return (Either.flatMap as any)(mgetOrSearchParser(query), (fValues: any) => {
    if (isMgetRequest(fValues)) {
      return Either.right(fValues);
    } else {
      const fValuesWithDefaults = withDefaults(fValues);

      if (isSearchByTickerRequest(fValuesWithDefaults)) {
        return Either.right(fValuesWithDefaults);
      } else if (isFullTextSearchRequest(fValuesWithDefaults)) {
        return Either.right(fValuesWithDefaults);
      } else {
        return Either.left(new ParseError(new Error('There is neither ticker nor search query')));
      }
    }
  });
};
