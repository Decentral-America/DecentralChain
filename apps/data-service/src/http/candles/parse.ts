import { Either, pipe } from 'effect';
import { isNil, mergeAll } from 'ramda';
import { ParseError, ValidationError } from '../../errorHandling';
import { loadConfig } from '../../loadConfig';
import { type WithMatcher } from '../../services/_common';
import { type CandlesSearchRequest } from '../../services/candles/repo';
import { CandleInterval } from '../../types';
import { type Interval, interval as intervalFromString } from '../../types/interval';
import { div } from '../../utils/interval';
import { parseFilterValues, withDefaults } from '../_common/filters';
import commonFilters from '../_common/filters/filters';
import { type HttpRequest } from '../_common/types';

const config = loadConfig();

export const MAX_CANDLES_COUNT = 1440;

export const CandleIntervals = [
  CandleInterval.Month1,
  CandleInterval.Week1,
  CandleInterval.Day1,
  CandleInterval.Hour12,
  CandleInterval.Hour6,
  CandleInterval.Hour4,
  CandleInterval.Hour3,
  CandleInterval.Hour2,
  CandleInterval.Hour1,
  CandleInterval.Minute30,
  CandleInterval.Minute15,
  CandleInterval.Minute5,
  CandleInterval.Minute1,
];

type ParseIntervalOptions = {
  min: Interval;
  max: Interval;
  divisibleBy: Interval;
  allowed: CandleInterval[];
};

export const parseInterval =
  ({ min, max, divisibleBy, allowed }: ParseIntervalOptions) =>
  (v: string | undefined): Either.Either<Interval | undefined, ParseError> =>
    Either.flatMap(commonFilters.query(v), (s: string | undefined) => {
      if (isNil(s)) return Either.right(s);

      return pipe(
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: interval parsing logic requires multiple validations
        Either.flatMap(intervalFromString(s), (i: Interval) => {
          if (i.length < min.length) {
            return Either.left(
              new ValidationError('Provided interval is smaller then minimum allowed', {
                actual: i.source,
                allowed: min.source,
              }),
            );
          }

          if (i.length > max.length) {
            return Either.left(
              new ValidationError('Provided interval is bigger then maximum allowed', {
                actual: i.source,
                allowed: max.source,
              }),
            );
          }

          const d = div(i, divisibleBy);
          if (d % 1 > 0) {
            return Either.left(
              new ValidationError(`Interval must be divisible by ${divisibleBy.source}`),
            );
          }

          if (
            Array.isArray(allowed) &&
            allowed.length > 0 &&
            isNil(allowed.find((candleInterval) => candleInterval === i.source))
          ) {
            return Either.left(
              new ValidationError('Interval must be one of the allowed', {
                actual: i.source,
                allowed,
              }),
            );
          }

          return Either.right(i);
        }),
        Either.mapLeft((e) => new ParseError(e.error, e.meta)),
      );
    });

export const parse = ({
  params,
  query,
}: HttpRequest<['amountAsset', 'priceAsset']>): Either.Either<CandlesSearchRequest, ParseError> => {
  if (isNil(params)) {
    return Either.left(new ParseError(new Error('Params is empty')));
  }

  if (isNil(query)) {
    return Either.left(new ParseError(new Error('Query is empty')));
  }

  const minInterval = Either.getOrThrow(intervalFromString('1m'));
  const maxInterval = Either.getOrThrow(intervalFromString('1M'));

  return (Either.flatMap as any)(
    parseFilterValues({
      interval: parseInterval({
        allowed: CandleIntervals,
        divisibleBy: minInterval,
        max: maxInterval,
        min: minInterval,
      }),
      matcher: commonFilters.query,
    })(query),
    (fValues: any) => {
      const fValuesWithDefaults: Partial<CandlesSearchRequest & WithMatcher> = mergeAll<any>([
        {
          matcher: config.matcher.defaultMatcherAddress,
          timeEnd: new Date(),
        },
        withDefaults(fValues),
      ]);

      if (!fValuesWithDefaults.matcher) {
        return Either.left(new ParseError(new Error('Matcher is not defined')));
      }

      if (isNil(fValuesWithDefaults.timeStart)) {
        return Either.left(new ParseError(new Error('timeStart is required')));
      }

      if (isNil(fValuesWithDefaults.interval)) {
        return Either.left(new ParseError(new Error('interval is required')));
      }

      if (isNil(fValuesWithDefaults.matcher)) {
        return Either.left(new ParseError(new Error('matcher is required')));
      }

      const periodLength =
        (fValuesWithDefaults.timeEnd as Date).getTime() -
        (fValuesWithDefaults.timeStart as Date).getTime();
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
        matcher: fValuesWithDefaults.matcher,
        priceAsset: params.priceAsset,
        timeEnd: fValuesWithDefaults.timeEnd ?? new Date(),
        timeStart: fValuesWithDefaults.timeStart,
      } as CandlesSearchRequest);
    },
  );
};
