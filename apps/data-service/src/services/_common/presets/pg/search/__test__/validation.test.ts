import { of as task } from 'folktale/concurrency/task';
import { Error as error, Ok as ok, type Result } from 'folktale/result';
import { always, identity, T } from 'ramda';

import { type PgDriver } from '../../../../../../db/driver';
import { type AppError, ValidationError } from './../../../../../../errorHandling';
import { type SearchedItems } from '../../../../../../types';
import { Joi } from '../../../../../../utils/validation';
import { type RequestWithCursor } from '../../../../../_common/pagination';
import { SortOrder, type WithLimit, type WithSortOrder } from '../../../..';
import { searchPreset } from '../../search';

const mockTxs: ResponseRaw[] = [
  { id: 'q', timestamp: new Date(), uid: 1 },
  { id: 'w', timestamp: new Date(), uid: 2 },
];

type ResponseRaw = {
  uid: number;
  id: string;
  timestamp: Date;
};

type Cursor = {
  uid: number;
};

const serialize = (
  request: RequestWithCursor<WithLimit, string>,
  response: ResponseRaw,
): string | undefined =>
  response === null ? undefined : Buffer.from(response.uid.toString()).toString('base64');

const deserialize = (cursor: string): Result<ValidationError, Cursor> => {
  const data = Buffer.from(cursor, 'base64').toString('utf8').split('::');

  const err = (message?: string) =>
    new ValidationError('Cursor deserialization is failed', {
      cursor,
      message,
    });

  return (
    ok<ValidationError, string[]>(data)
      // validate length
      .chain((d) =>
        d.length === 1
          ? ok<ValidationError, number>(parseInt(d[0]))
          : error<ValidationError, number>(err('Cursor length is not equals to 1')),
      )
      .map((uid) => ({
        uid,
      }))
  );
};

const service = searchPreset<
  Cursor,
  RequestWithCursor<WithLimit & WithSortOrder, string>,
  ResponseRaw,
  ResponseRaw
>({
  cursorSerialization: {
    deserialize,
    serialize,
  },
  name: 'some_name',
  resultSchema: Joi.any(),
  sql: () => '',
  transformResult: identity,
})({
  emitEvent: always(T),
  pg: { any: (filters) => task(mockTxs) } as PgDriver,
});

describe('search preset validation', () => {
  describe('common filters', () => {
    it('passes if correct object is provided', (done) =>
      service({
        limit: 1,
        sort: SortOrder.Descending,
      })
        .run()
        .listen({
          onRejected: (e: AppError) => {
            done(e.error.message);
          },
          onResolved: (x: SearchedItems<any>) => {
            expect(x.items).toBeInstanceOf(Array);
            done();
          },
        }));
  });
});
