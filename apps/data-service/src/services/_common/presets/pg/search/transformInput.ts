import { Ok as ok, type Result } from 'folktale/result';
import { compose, evolve, inc, omit } from 'ramda';

import { type ValidationError } from '../../../../../errorHandling';
import { type WithLimit } from '../../../../_common';
import { type CursorSerialization, type RequestWithCursor } from '../../../pagination';

export const transformInput =
  <Cursor, Request extends WithLimit>(
    deserialize: CursorSerialization<Cursor, Request, Response>['deserialize'],
  ) =>
  (
    request: RequestWithCursor<Request, string>,
  ): Result<ValidationError, RequestWithCursor<Request, Cursor>> => {
    const requestWithoutAfter = compose<
      RequestWithCursor<Request, string>,
      any, // hack for evolve output -> omit input type
      Request
    >(
      omit(['after']),
      evolve({ limit: inc }),
    )(request);

    if (!request.after) {
      return ok(requestWithoutAfter);
    } else {
      return deserialize(request.after).map((cursor) => ({
        ...requestWithoutAfter,
        after: cursor,
      }));
    }
  };
