import { Ok as ok, type Result } from 'folktale/result';
import { type ValidationError } from '../../../errorHandling';
import { type AliasInfo } from '../../../types';
import { type AliasesSearchRequest } from '../repo';

export type Cursor = string;

export const serialize = <ResponseTransformed extends AliasInfo>(
  request: AliasesSearchRequest,
  response: ResponseTransformed,
): string => Buffer.from(response.alias).toString('base64');

export const deserialize = (cursor: string): Result<ValidationError, Cursor> => {
  return ok<ValidationError, Cursor>(Buffer.from(cursor, 'base64').toString('utf8'));
};
