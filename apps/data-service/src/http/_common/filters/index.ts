import { Either, pipe } from 'effect';
import { isNil, mapObjIndexed, reject } from 'ramda';
import { type ParseError } from '../../../errorHandling';
import { SortOrder, type WithLimit, type WithSortOrder } from '../../../services/_common';
import commonFilters from './filters';
import { type CommonFilters, type Parser } from './types';

const DEFAULT_LIMIT = 100;
const DEFAULT_SORT = SortOrder.Descending;

export const DEFAULT_MAX_LIMIT = DEFAULT_LIMIT;

export const withDefaults = <T>(fValues: T): T & WithLimit & WithSortOrder =>
  ({ limit: DEFAULT_LIMIT, sort: DEFAULT_SORT, ...fValues }) as T & WithLimit & WithSortOrder;

export const parseFilterValues =
  <Filters extends Record<string, Parser<any, any>>>(filters: Filters) =>
  <
    AllParsedFilterValues extends {
      [K in keyof Filters]: ReturnType<Filters[K]>;
    } & { [K in keyof CommonFilters]: ReturnType<CommonFilters[K]> },
    ParsedFilterValues extends Partial<
      {
        [K in keyof Filters]: Filters[K] extends Parser<infer R> ? R : never;
      } & {
        [K in keyof CommonFilters]: CommonFilters[K] extends Parser<infer R>
          ? R extends undefined
            ? Partial<R>
            : R
          : never;
      }
    >,
  >(
    values: Partial<
      { [K in keyof Filters]: Parameters<Filters[K]>[0] } & {
        [K in keyof CommonFilters]: Parameters<CommonFilters[K]>[0];
      }
    >,
  ): Either.Either<ParsedFilterValues, ParseError> => {
    const allFilters = { ...commonFilters, ...filters };
    const parsed = (mapObjIndexed as any)(
      (val: any, key: string) => val((values as any)[key]),
      allFilters,
    ) as AllParsedFilterValues;

    const reduced = Object.keys(parsed).reduce(
      (acc: Either.Either<ParsedFilterValues, ParseError>, cur) => {
        return Either.flatMap(acc, (a) => {
          const result: Either.Either<any, ParseError> | undefined = (parsed as any)[cur];
          if (result === undefined) return Either.right(a);
          if (Either.isLeft(result)) return result as Either.Either<ParsedFilterValues, ParseError>;
          return Either.right({ ...a, [cur]: result.right });
        });
      },
      Either.right({} as ParsedFilterValues),
    );

    return pipe(
      reduced,
      Either.map(reject(isNil) as (v: ParsedFilterValues) => ParsedFilterValues),
    );
  };
