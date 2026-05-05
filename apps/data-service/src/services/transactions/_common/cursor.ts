import { BigNumber } from '@decentralchain/data-entities';
import { Either, pipe } from 'effect';
import { ValidationError } from '../../../errorHandling';
import { SortOrder, type WithSortOrder } from '../../_common';
import { type WithTxUid } from './types';

const isSortOrder = (s: string): s is SortOrder =>
  s === SortOrder.Ascending || s === SortOrder.Descending;

export type Cursor = {
  uid: BigNumber;
  sort: SortOrder;
};

export const serialize = <Request extends WithSortOrder, Response extends WithTxUid>(
  request: Request,
  response: Response,
): string | undefined =>
  response === null
    ? undefined
    : Buffer.from(`${response.uid.toString()}::${request.sort}`).toString('base64');

export const deserialize = (cursor: string): Either.Either<Cursor, ValidationError> => {
  const data = Buffer.from(cursor, 'base64').toString('utf8').split('::');

  const err = (message?: string) =>
    new ValidationError('Cursor deserialization is failed', { cursor, message });

  return pipe(
    Either.right(data),
    Either.flatMap((d) =>
      d.length === 2 ? Either.right(d) : Either.left(err('Cursor length is not equals to 2')),
    ),
    Either.flatMap((d) => {
      const s = d[1];
      if (typeof s === 'string' && isSortOrder(s)) {
        return Either.right([new BigNumber(d[0] as string), s] as [BigNumber, SortOrder]);
      } else {
        return Either.left(err('Sort is not valid'));
      }
    }),
    Either.map(([uid, sort]) => ({ sort, uid })),
  );
};
