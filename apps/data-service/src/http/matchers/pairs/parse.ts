import { Error as error, Ok as ok, type Result } from 'folktale/result';
import { isNil, mergeAll } from 'ramda';
import { ParseError } from '../../../errorHandling';
import { type WithLimit, type WithMatcher, type WithSortOrder } from '../../../services/_common';
import { type PairsServiceSearchRequest } from '../../../services/pairs';
import { type PairsGetRequest, type PairsMgetRequest } from '../../../services/pairs/repo/types';
import { withDefaults } from '../../_common/filters';
import { type HttpRequest } from '../../_common/types';
import {
  isMgetRequest,
  isSearchByAssetRequest,
  isSearchByAssetsRequest,
  isSearchCommonRequest,
  mgetOrSearchParser,
} from '../../pairs/utils';

export const get = ({
  params,
}: HttpRequest<['matcher', 'amountAsset', 'priceAsset']>): Result<ParseError, PairsGetRequest> => {
  if (isNil(params)) {
    return error(new ParseError(new Error('Params is empty')));
  }

  if (params.amountAsset && params.priceAsset) {
    return ok({
      matcher: params.matcher,
      pair: {
        amountAsset: params.amountAsset,
        priceAsset: params.priceAsset,
      },
    });
  } else {
    return error(new ParseError(new Error('AmountAssetId or PriceAssetId are not set')));
  }
};

export const mgetOrSearch = ({
  params,
  query,
}: HttpRequest<['matcher']>): Result<ParseError, PairsMgetRequest | PairsServiceSearchRequest> => {
  if (isNil(params)) {
    return error(new ParseError(new Error('Params is empty')));
  }

  if (isNil(query)) {
    return error(new ParseError(new Error('Query is empty')));
  }

  return mgetOrSearchParser(query).chain((fValues) => {
    if (isMgetRequest(fValues)) {
      return ok({
        matcher: params.matcher,
        pairs: fValues.pairs,
      });
    } else {
      const fValuesWithDefaults = mergeAll<
        PairsServiceSearchRequest & WithMatcher & WithSortOrder & WithLimit
      >([
        withDefaults(fValues),
        {
          matcher: params.matcher,
        },
      ]);

      if (isSearchCommonRequest(fValuesWithDefaults)) {
        if (isSearchByAssetRequest(fValuesWithDefaults)) {
          return ok(fValuesWithDefaults);
        } else if (isSearchByAssetsRequest(fValuesWithDefaults)) {
          return ok(fValuesWithDefaults);
        } else {
          return ok(fValuesWithDefaults);
        }
      } else {
        return error(new ParseError(new Error('Invalid request data'), fValuesWithDefaults));
      }
    }
  });
};
