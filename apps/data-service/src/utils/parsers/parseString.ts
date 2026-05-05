import { Either } from 'effect';
import { isNil } from 'ramda';
import { type Parser } from '../../http/_common/filters/types';

export type ParseTrimmedStringIfDefined = Parser<string>;

export const parseTrimmedStringIfDefined: ParseTrimmedStringIfDefined = (q) =>
  Either.right(isNil(q) ? undefined : q.toString().trim());
