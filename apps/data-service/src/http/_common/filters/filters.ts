import { Either } from 'effect';
import { isNil } from 'ramda';
import { ParseError } from '../../../errorHandling';
import { isSortOrder } from '../../../services/_common';
import { parseArrayQuery, parseDate, parseTrimmedStringIfDefined } from '../../../utils/parsers';
import { DEFAULT_MAX_LIMIT } from './';
import { type CommonFilters } from './types';

// default limit is 100
export const limit =
  (max: number): CommonFilters['limit'] =>
  (raw) => {
    if (isNil(raw)) {
      return Either.right(undefined);
    } else {
      const n = parseInt(raw, 10);
      if (Number.isNaN(n)) {
        return Either.left(new ParseError(new Error('limit has to be a number')));
      } else if (n > max) {
        return Either.left(new ParseError(new Error(`Max limit ${max} exceeded`)));
      } else {
        return Either.right(n);
      }
    }
  };

// default sort is SortOrder.Descending
const sort: CommonFilters['sort'] = (s) =>
  typeof s === 'undefined'
    ? Either.right(undefined)
    : isSortOrder(s)
      ? Either.right(s)
      : Either.left(new ParseError(new Error('Invalid sort value')));

const after: CommonFilters['after'] = parseTrimmedStringIfDefined;

export default {
  after,
  blockTimeEnd: parseDate,
  blockTimeStart: parseDate,
  ids: parseArrayQuery,
  limit: limit(DEFAULT_MAX_LIMIT),
  query: parseTrimmedStringIfDefined,
  sender: parseTrimmedStringIfDefined,
  senders: parseArrayQuery,
  sort,
  timeEnd: parseDate,
  timeStart: parseDate,
};
