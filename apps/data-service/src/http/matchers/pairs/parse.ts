import { Either, pipe } from 'effect';
import { isNil, mergeAll } from 'ramda';
import { ParseError } from '../../../errorHandling';
import { type WithLimit, type WithMatcher, type WithSortOrder } from '../../../services/_common';
import { type PairsServiceSearchRequest } from '../../../services/pairs';
import { type PairsGetRequest, type PairsMgetRequest } from '../../../services/pairs/repo/types';
import { withDefaults } from '../../_common/filters';
import { type HttpRequest } from '../../_common/types';
import { isMgetRequest, isSearchCommonRequest, mgetOrSearchParser } from '../../pairs/utils';

export const get = ({
  params,
}: HttpRequest<['matcher', 'amountAsset', 'priceAsset']>): Either.Either<
  PairsGetRequest,
  ParseError
> => {
  if (isNil(params)) {
    return Either.left(new ParseError(new Error('Params is empty')));
  }

  if (params.amountAsset && params.priceAsset) {
    return Either.right({
      matcher: params.matcher,
      pair: {
        amountAsset: params.amountAsset,
        priceAsset: params.priceAsset,
      },
    });
  } else {
    return Either.left(new ParseError(new Error('AmountAssetId or PriceAssetId are not set')));
  }
};

export const mgetOrSearch = ({
  params,
  query,
}: HttpRequest<['matcher']>): Either.Either<
  PairsMgetRequest | PairsServiceSearchRequest,
  ParseError
> => {
  if (isNil(params)) {
    return Either.left(new ParseError(new Error('Params is empty')));
  }

  if (isNil(query)) {
    return Either.left(new ParseError(new Error('Query is empty')));
  }

  return pipe(
    mgetOrSearchParser(query),
    Either.flatMap(
      (fValues): Either.Either<PairsMgetRequest | PairsServiceSearchRequest, ParseError> => {
        if (isMgetRequest(fValues)) {
          return Either.right({
            matcher: params.matcher,
            pairs: fValues.pairs,
          });
        } else {
          const fValuesWithDefaults = mergeAll<any>([
            withDefaults(fValues),
            {
              matcher: params.matcher,
            },
          ]) as PairsServiceSearchRequest & WithMatcher & WithSortOrder & WithLimit;

          if (isSearchCommonRequest(fValuesWithDefaults)) {
            return Either.right(fValuesWithDefaults);
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
