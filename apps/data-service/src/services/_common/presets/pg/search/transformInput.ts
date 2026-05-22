import { Either, pipe } from 'effect';
import { inc, omit } from 'ramda';
import { type ValidationError } from '../../../../../errorHandling';
import { type WithLimit } from '../../../../_common';
import { type CursorSerialization, type RequestWithCursor } from '../../../pagination';

export const transformInput =
  <Cursor, Request extends WithLimit>(
    deserialize: CursorSerialization<Cursor, Request, Response>['deserialize'],
  ) =>
  (
    request: RequestWithCursor<Request, string>,
  ): Either.Either<RequestWithCursor<Request, Cursor>, ValidationError> => {
    const requestWithoutAfter = {
      ...omit(['after'], request),
      limit: inc(request.limit),
    } as Request;

    if (!request.after) {
      return Either.right(requestWithoutAfter as RequestWithCursor<Request, Cursor>);
    } else {
      return pipe(
        deserialize(request.after),
        Either.map(
          (cursor) =>
            ({ ...requestWithoutAfter, after: cursor }) as RequestWithCursor<Request, Cursor>,
        ),
      );
    }
  };
