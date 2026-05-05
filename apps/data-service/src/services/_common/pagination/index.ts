import { type Either } from 'effect';
import { type ValidationError } from '../../../errorHandling';

export type CursorSerialization<Cursor, Request, Response> = {
  serialize: (request: Request, response: Response) => string | undefined;
  deserialize: (cursor: string) => Either.Either<Cursor, ValidationError>;
};

export type RequestWithCursor<Request, CursorType> = Request & {
  after?: CursorType;
};
