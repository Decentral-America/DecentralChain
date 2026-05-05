import { Either } from 'effect';
import { isNil } from 'ramda';
import { ParseError } from '../../errorHandling';
import { type Parser } from '../../http/_common/filters/types';

export type ParseArrayQuery = Parser<string[], string | string[]>;

export function parseArrayQuery(strOrArr: undefined): Either.Either<undefined, ParseError>;
export function parseArrayQuery(strOrArr: string | string[]): Either.Either<string[], ParseError>;
export function parseArrayQuery(
  strOrArr: string | string[] | undefined,
): Either.Either<string[] | undefined, ParseError> {
  if (isNil(strOrArr)) return Either.right(undefined);
  if (typeof strOrArr === 'string') {
    return Either.right(strOrArr.length === 0 ? [] : strOrArr.split(','));
  }
  if (Array.isArray(strOrArr)) return Either.right(strOrArr);
  return Either.left(new ParseError(new Error('Invalid array')));
}
