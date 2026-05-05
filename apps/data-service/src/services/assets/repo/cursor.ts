import { Either } from 'effect';
import { ValidationError } from '../../../errorHandling';
import { assetId as assetIdRegExp } from '../../../utils/regex';
import { type AssetDbResponse, type AssetsSearchRequest } from './types';

export type Cursor = string;

export const serialize = <Response extends AssetDbResponse>(
  _request: AssetsSearchRequest,
  response: Response,
): string | undefined =>
  response === null ? undefined : Buffer.from(response.asset_id.toString()).toString('base64');

export const deserialize = (cursor: string): Either.Either<Cursor, ValidationError> => {
  const assetId = Buffer.from(cursor, 'base64').toString('utf-8');
  if (assetIdRegExp.test(assetId)) {
    return Either.right(Buffer.from(cursor, 'base64').toString('utf-8'));
  } else {
    return Either.left(
      new ValidationError('Cursor deserialization is failed', {
        cursor: 'Invalid data',
      }),
    );
  }
};
