import { type Result } from 'folktale/result';
import { type ValidationError } from '../../../errorHandling';

export type CursorSerialization<Cursor, Request, Response> = {
  serialize: (request: Request, response: Response) => string | undefined;
  deserialize: (cursor: string) => Result<ValidationError, Cursor>;
};

export type RequestWithCursor<Request, CursorType> = Request & {
  after?: CursorType;
};
