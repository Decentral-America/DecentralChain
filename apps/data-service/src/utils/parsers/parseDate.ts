import { Either } from 'effect';
import { isNil } from 'ramda';
import { ParseError } from '../../errorHandling';
import { type Parser } from '../../http/_common/filters/types';

export type ParseDate = Parser<Date>;

export const parseDate: ParseDate = (str) => {
  if (isNil(str)) return Either.right(undefined);
  const d = new Date(/^-?\d+$/.test(str) ? parseInt(str, 10) : str);
  return Number.isNaN(d.getTime())
    ? Either.left(new ParseError('Date is not valid'))
    : Either.right(d);
};
