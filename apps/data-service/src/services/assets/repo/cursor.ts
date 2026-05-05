import { Error as error, Ok as ok, type Result } from 'folktale/result';
import { ValidationError } from '../../../errorHandling';
import { assetId as assetIdRegExp } from '../../../utils/regex';
import { type AssetDbResponse, type AssetsSearchRequest } from './types';

export type Cursor = string;

export const serialize = <Response extends AssetDbResponse>(
  request: AssetsSearchRequest,
  response: Response,
): string | undefined =>
  response === null ? undefined : Buffer.from(response.asset_id.toString()).toString('base64');

export const deserialize = (cursor: string): Result<ValidationError, Cursor> => {
  const assetId = Buffer.from(cursor, 'base64').toString('utf-8');
  if (assetIdRegExp.test(assetId)) {
    return ok<ValidationError, Cursor>(Buffer.from(cursor, 'base64').toString('utf-8'));
  } else {
    return error<ValidationError, Cursor>(
      new ValidationError('Cursor deserialization is failed', {
        cursor: 'Invalid data',
      }),
    );
  }
};
