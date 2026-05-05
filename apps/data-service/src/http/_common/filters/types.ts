import { type Either } from 'effect';
import { type ParseError } from '../../../errorHandling';
import { type SortOrder } from '../../../services/_common';
import { type ParseArrayQuery } from '../../../utils/parsers/parseArrayQuery';
import { type ParseDate } from '../../../utils/parsers/parseDate';
import { type ParseTrimmedStringIfDefined } from '../../../utils/parsers/parseString';

export type CommonFilters = {
  timeStart: ParseDate;
  timeEnd: ParseDate;
  limit: Parser<number>;
  sort: Parser<SortOrder>;
  after: ParseTrimmedStringIfDefined;
  ids: ParseArrayQuery;
  query: Parser<string>;
};

export type Parser<Res, Raw = string> = (raw?: Raw) => Either.Either<Res | undefined, ParseError>;

export type ParsedFilterValues<ParserFnType extends (...args: any[]) => any> =
  ReturnType<ParserFnType> extends Either.Either<infer R, ParseError> ? R : never;
