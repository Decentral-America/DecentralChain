import { Error as error, Ok as ok, type Result } from 'folktale/result';
import { compose, isNil, mapObjIndexed, merge, reject } from 'ramda';
import { type ParseError } from '../../../errorHandling';
import { SortOrder, type WithLimit, type WithSortOrder } from '../../../services/_common';
import commonFilters from './filters';
import { type CommonFilters, type Parser } from './types';

const DEFAULT_LIMIT = 100;
const DEFAULT_SORT = SortOrder.Descending;

export const DEFAULT_MAX_LIMIT = DEFAULT_LIMIT;

export const withDefaults = <T>(fValues: T): T & WithLimit & WithSortOrder =>
  merge(
    {
      limit: DEFAULT_LIMIT,
      sort: DEFAULT_SORT,
    },
    fValues,
  );

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
      // Parameters<Filters[K]>[0] is the 1st arg of Parser - raw value
      { [K in keyof Filters]: Parameters<Filters[K]>[0] } & {
        [K in keyof CommonFilters]: Parameters<CommonFilters[K]>[0];
      }
    >,
  ): Result<ParseError, ParsedFilterValues> =>
    compose<
      Filters | CommonFilters,
      AllParsedFilterValues,
      Result<ParseError, ParsedFilterValues>,
      Result<ParseError, ParsedFilterValues>
    >(
      (r) => r.map(reject(isNil)),
      (d) =>
        Object.keys(d).reduce(
          (acc, cur) =>
            acc.chain((a) =>
              d[cur].matchWith({
                Error: ({ value }) => error(value),
                Ok: ({ value }) =>
                  ok({
                    ...a,
                    [cur]: value,
                  }),
              }),
            ),
          ok<ParseError, ParsedFilterValues>({} as ParsedFilterValues),
        ),
      mapObjIndexed<
        Parser<ParsedFilterValues[keyof ParsedFilterValues]>,
        ReturnType<Parser<ParsedFilterValues[keyof ParsedFilterValues]>>,
        AllParsedFilterValues
      >((val, key) => val(values[key])),
    )({ ...commonFilters, ...filters });
