import { Error as error, Ok as ok, type Result } from 'folktale/result';
import { ValidationError } from '../../../errorHandling';
import { type PairDbResponse } from './transformResult';
import { type PairsSearchRequest } from './types';

export type Cursor = [string, string];

export const serialize = <ResponseTransformed extends PairDbResponse>(
  request: PairsSearchRequest,
  response: ResponseTransformed,
): string =>
  Buffer.from(`${response.amount_asset_id}:${response.price_asset_id}`).toString('base64');

export const deserialize = (cursor: string): Result<ValidationError, Cursor> => {
  const data = Buffer.from(cursor, 'base64').toString('utf8').split(':');
  if (data.length === 2) {
    return ok<ValidationError, Cursor>(data as [string, string]);
  } else {
    return error(new ValidationError('Invalid cursor'));
  }
};
