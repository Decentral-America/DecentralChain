import { Either, Option } from 'effect';
import { isNil } from 'ramda';
import { ParseError } from '../../../errorHandling';
import { type RateMgetParams } from '../../../types';
import { parseDate, parsePairs } from '../../../utils/parsers';
import { parseFilterValues } from '../../_common/filters';
import { type HttpRequest } from '../../_common/types';

export const parse = ({
  params,
  query,
}: HttpRequest<['matcher']>): Either.Either<RateMgetParams, ParseError> => {
  if (isNil(params)) {
    return Either.left(new ParseError(new Error('Params is empty')));
  }
  if (isNil(query)) {
    return Either.left(new ParseError(new Error('Query is empty')));
  }

  return Either.flatMap(
    parseFilterValues({
      pairs: parsePairs,
      timestamp: parseDate,
    })(query),
    (fValues) => {
      if (isNil(fValues.pairs)) {
        return Either.left(new ParseError(new Error('Pairs are incorrect or are not set')));
      }

      return Either.right({
        matcher: params.matcher,
        pairs: fValues.pairs,
        timestamp: Option.fromNullable(fValues.timestamp),
      });
    },
  );
};
