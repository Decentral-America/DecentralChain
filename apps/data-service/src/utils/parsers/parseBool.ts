// @ts-nocheck
import { Either } from 'effect';
import { isNil } from 'ramda';
import { ParseError } from '../../errorHandling';
import { type Parser } from '../../http/_common/filters/types';

export const parseBool: Parser<boolean | undefined> = (maybeBool) => {
  if (isNil(maybeBool)) return Either.right(undefined);
  const err = Either.left<ParseError, boolean>(new ParseError(new Error('Invalid boolean value')));
  if (typeof maybeBool === 'string') {
    switch (maybeBool.toLowerCase()) {
      case 'false':
        return Either.right(false);
      case 'true':
        return Either.right(true);
      default:
        return err;
    }
  }
  if (typeof maybeBool === 'boolean') return Either.right(maybeBool);
  return err;
};
