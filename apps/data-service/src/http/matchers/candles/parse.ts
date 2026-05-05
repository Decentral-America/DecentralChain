import { Either } from 'effect';
import { isNil, mergeAll } from 'ramda';

import { ParseError } from '../../../errorHandling';
import { type CandlesSearchRequest } from '../../../services/candles/repo';
import { interval as intervalFromString } from '../../../types/interval';
import { parseFilterValues, withDefaults } from '../../_common/filters';
import { type HttpRequest } from '../../_common/types';
import { CandleIntervals, MAX_CANDLES_COUNT, parseInterval } from '../../candles/parse';

export const parse = ({
  params,
  query,
}: HttpRequest<['matcher', 'amountAsset', 'priceAsset']>): Either.Either<
  CandlesSearchRequest,
  ParseError
> => {
  if (isNil(params)) {
    return Either.left(new ParseError(new Error('Params is empty')));
  }

  if (isNil(query)) {
    return Either.left(new ParseError(new Error('Query is empty')));
  }

  const minInterval = Either.getOrThrow(intervalFromString('1m'));
  const maxInterval = Either.getOrThrow(intervalFromString('1M'));

  return Either.flatMap(
    parseFilterValues({
      interval: parseInterval({
        allowed: CandleIntervals,
        divisibleBy: minInterval,
        max: maxInterval,
        min: minInterval,
      }),
    })(query),
    (fValues) => {
      const fValuesWithDefaults: Partial<CandlesSearchRequest> = mergeAll<any>([
        {
          timeEnd: new Date(),
        },
        withDefaults(fValues),
      ]);

      if (isNil(fValuesWithDefaults.timeStart)) {
        return Either.left(new ParseError(new Error('timeStart is undefined')));
      }

      if (isNil(fValuesWithDefaults.interval)) {
        return Either.left(new ParseError(new Error('interval is undefined')));
      }

      const periodLength =
        (fValuesWithDefaults.timeEnd ?? new Date()).getTime() -
        fValuesWithDefaults.timeStart.getTime();
      const expectedCandlesCount = Math.ceil(periodLength / fValuesWithDefaults.interval.length);
      if (expectedCandlesCount > MAX_CANDLES_COUNT) {
        return Either.left(
          new ParseError(
            new Error(
              `${expectedCandlesCount} of candles is more then allowed of ${MAX_CANDLES_COUNT}. Try to decrease requested period of time.`,
            ),
          ),
        );
      }

      return Either.right({
        amountAsset: params.amountAsset,
        interval: fValuesWithDefaults.interval,
        matcher: params.matcher,
        priceAsset: params.priceAsset,
        timeEnd: fValuesWithDefaults.timeEnd ?? new Date(),
        timeStart: fValuesWithDefaults.timeStart,
      } as CandlesSearchRequest);
    },
  );
};
