import { Either } from 'effect';
import { ValidationError } from '../../../errorHandling';
import { type PairDbResponse } from './transformResult';
import { type PairsSearchRequest } from './types';

export type Cursor = [string, string];

export const serialize = <ResponseTransformed extends PairDbResponse>(
  _request: PairsSearchRequest,
  response: ResponseTransformed,
): string =>
  Buffer.from(`${response.amount_asset_id}:${response.price_asset_id}`).toString('base64');

export const deserialize = (cursor: string): Either.Either<Cursor, ValidationError> => {
  const data = Buffer.from(cursor, 'base64').toString('utf8').split(':');
  if (data.length === 2) {
    return Either.right(data as [string, string]);
  } else {
    return Either.left(new ValidationError('Invalid cursor'));
  }
};
