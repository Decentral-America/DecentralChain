import { Error as error, Ok as ok, type Result } from 'folktale/result';
import { isNil } from 'ramda';

import { ParseError } from '../../errorHandling';
import { type Parser } from '../../http/_common/filters/types';

export type ParseArrayQuery = Parser<string[], string | string[]>;

export function parseArrayQuery(strOrArr: undefined): Result<ParseError, undefined>;
export function parseArrayQuery(strOrArr: string | string[]): Result<ParseError, string[]>;
export function parseArrayQuery(
  strOrArr: string | string[] | undefined,
): Result<ParseError, string[] | undefined> {
  if (isNil(strOrArr)) {
    return ok(undefined);
  } else if (typeof strOrArr === 'string') {
    if (!strOrArr.length) return ok([]);
    else return ok(strOrArr.split(','));
  } else if (Array.isArray(strOrArr)) {
    return ok(strOrArr);
  } else {
    return error(new ParseError(new Error('Invalid array')));
  }
}
