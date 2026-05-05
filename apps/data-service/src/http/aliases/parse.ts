import { Either } from 'effect';
import { identity, mergeAll } from 'ramda';
import { ParseError } from '../../errorHandling';
import {
  type AliasesServiceGetRequest,
  type AliasesServiceMgetRequest,
  type AliasesServiceSearchRequest,
  type WithAddress,
  type WithAddresses,
  type WithQueries,
} from '../../services/aliases';
import { type ParseArrayQuery, parseArrayQuery } from '../../utils/parsers/parseArrayQuery';
import { parseBool } from '../../utils/parsers/parseBool';
import { parseFilterValues, withDefaults } from '../_common/filters';
import commonFilters from '../_common/filters/filters';
import { type ParsedFilterValues } from '../_common/filters/types';
import { type HttpRequest } from '../_common/types';

const LIMIT = 1000;

const mgetOrSearchParser = parseFilterValues({
  address: commonFilters.query,
  addresses: parseArrayQuery as ParseArrayQuery,
  aliases: parseArrayQuery as ParseArrayQuery,
  queries: parseArrayQuery as ParseArrayQuery,
  showBroken: parseBool,
});

type ParserFnType = typeof mgetOrSearchParser;

const isMgetRequest = (req: ParsedFilterValues<ParserFnType>): req is AliasesServiceMgetRequest =>
  'aliases' in req && Array.isArray(req.aliases);

const isSearchWithAddressRequest = (
  req: ParsedFilterValues<ParserFnType>,
): req is AliasesServiceSearchRequest & WithAddress => typeof req.address === 'string';

const isSearchWithAddressesRequest = (
  req: ParsedFilterValues<ParserFnType>,
): req is AliasesServiceSearchRequest & WithAddresses => Array.isArray(req.addresses);

const isSearchWithQueriesRequest = (
  req: ParsedFilterValues<ParserFnType>,
): req is AliasesServiceSearchRequest & WithQueries => Array.isArray(req.queries);

export const get = ({
  params,
}: HttpRequest<['id']>): Either.Either<AliasesServiceGetRequest, ParseError> => {
  if (params) {
    return Either.right({ id: params.id });
  } else {
    return Either.left(new ParseError(new Error('AliasId is required')));
  }
};

export const mgetOrSearch = ({
  query,
}: HttpRequest): Either.Either<
  AliasesServiceMgetRequest | AliasesServiceSearchRequest,
  ParseError
> => {
  if (!query) {
    return Either.left(new ParseError(new Error('Query is empty')));
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex request parsing logic
  return (Either.flatMap as any)(mgetOrSearchParser(query), (fValues: any) => {
    if (isMgetRequest(fValues)) {
      return Either.right(fValues);
    } else {
      let fValuesWithDefaults = withDefaults(fValues);
      fValuesWithDefaults = mergeAll<any>([
        { showBroken: false },
        fValuesWithDefaults,
        { limit: LIMIT },
      ]);

      if (
        [
          isSearchWithAddressRequest(fValuesWithDefaults),
          isSearchWithAddressesRequest(fValuesWithDefaults),
          isSearchWithQueriesRequest(fValuesWithDefaults),
        ].filter(identity).length > 1
      ) {
        return Either.left(
          new ParseError(
            new Error(
              'Request contains a conflict between exclusive peers [address, addresses, queries]',
            ),
          ),
        );
      }

      if (isSearchWithAddressRequest(fValuesWithDefaults as any)) {
        if (!((fValuesWithDefaults as any).address as string).length) {
          return Either.left(new ParseError(new Error('`address` is not allowed to be empty')));
        } else {
          return Either.right(fValuesWithDefaults as any);
        }
      } else if (isSearchWithAddressesRequest(fValuesWithDefaults as any)) {
        if (
          ((fValuesWithDefaults as any).addresses as string[]).filter((v) => v.length === 0)
            .length > 0
        ) {
          return Either.left(
            new ParseError(new Error('`addresses` is not allowed to be has an empty value')),
          );
        } else {
          return Either.right(fValuesWithDefaults as any);
        }
      } else if (isSearchWithQueriesRequest(fValuesWithDefaults as any)) {
        return Either.right(fValuesWithDefaults as any);
      } else {
        return Either.left(
          new ParseError(
            new Error('Neither `address` nor `addresses` nor `queries` were not provided'),
          ),
        );
      }
    }
  });
};
