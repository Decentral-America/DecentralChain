import { Either, pipe } from 'effect';
import { isNil, mergeAll } from 'ramda';
import { ParseError } from '../../errorHandling';
import { loadConfig } from '../../loadConfig';
import { type WithLimit, type WithMatcher, type WithSortOrder } from '../../services/_common';
import { type PairsServiceSearchRequest } from '../../services/pairs';
import { type PairsGetRequest, type PairsMgetRequest } from '../../services/pairs/repo/types';
import { parseFilterValues, withDefaults } from '../_common/filters';
import commonFilters from '../_common/filters/filters';
import { type HttpRequest } from '../_common/types';
import {
  isMgetRequest,
  isSearchByAssetRequest,
  isSearchByAssetsRequest,
  isSearchCommonRequest,
  mgetOrSearchParser,
} from './utils';

export const get = ({
  params,
  query,
}: HttpRequest<['amountAsset', 'priceAsset']>): Either.Either<PairsGetRequest, ParseError> => {
  const config = loadConfig();
  if (isNil(params)) {
    return Either.left(new ParseError(new Error('Params is empty')));
  }

  if (isNil(query)) {
    return Either.left(new ParseError(new Error('Query is empty')));
  }

  return pipe(
    parseFilterValues({
      matcher: commonFilters.query,
    })(query),
    Either.flatMap((fValues): Either.Either<PairsGetRequest, ParseError> => {
      const fValuesWithDefaults: Partial<PairsGetRequest & WithMatcher> = mergeAll<any>([
        {
          matcher: config.matcher.defaultMatcherAddress,
        },
        withDefaults(fValues),
      ]);

      if (!fValuesWithDefaults.matcher) {
        return Either.left(new ParseError(new Error('Matcher is not defined')));
      }

      return Either.right({
        matcher: fValuesWithDefaults.matcher,
        pair: {
          amountAsset: params.amountAsset,
          priceAsset: params.priceAsset,
        },
      });
    }),
  );
};

export const mgetOrSearch = ({
  query,
}: HttpRequest): Either.Either<PairsMgetRequest | PairsServiceSearchRequest, ParseError> => {
  const config = loadConfig();
  if (!query) {
    return Either.left(new ParseError(new Error('Query is empty')));
  }

  return pipe(
    mgetOrSearchParser(query),
    Either.flatMap(
      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex request parsing logic
      (fValues): Either.Either<PairsMgetRequest | PairsServiceSearchRequest, ParseError> => {
        if (isMgetRequest(fValues)) {
          return Either.right(fValues);
        } else {
          const fValuesWithDefaults: Partial<
            PairsServiceSearchRequest & WithMatcher & WithSortOrder & WithLimit
          > = mergeAll<any>([
            {
              matcher: config.matcher.defaultMatcherAddress,
            },
            withDefaults(fValues),
          ]);

          if (isSearchCommonRequest(fValuesWithDefaults)) {
            if (isSearchByAssetRequest(fValuesWithDefaults)) {
              return Either.right(fValuesWithDefaults);
            } else if (isSearchByAssetsRequest(fValuesWithDefaults)) {
              return Either.right(fValuesWithDefaults);
            } else {
              return Either.right(fValuesWithDefaults);
            }
          } else {
            return Either.left(
              new ParseError(new Error('Invalid request data'), fValuesWithDefaults),
            );
          }
        }
      },
    ),
  );
};
