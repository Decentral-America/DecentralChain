import { type Result } from 'folktale/result';
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

export type Parser<Res, Raw = string> = (raw?: Raw) => Result<ParseError, Res | undefined>;

export type ParsedFilterValues<ParserFnType extends (...args: any[]) => any> =
  ReturnType<ParserFnType> extends Result<ParseError, infer R> ? R : never;
