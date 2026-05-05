import { of as taskOf } from 'folktale/concurrency/task';
import { of as maybeOf } from 'folktale/maybe';
import { Error as error, Ok as ok } from 'folktale/result';
import { identity } from 'ramda';
import { type PgDriver } from '../../../../db/driver';
import {
  AppError,
  type DbError,
  type ResolverError,
  type Timeout,
} from '../../../../errorHandling';
import { mget } from '../../createResolver';
import { type ValidateSync } from '../types';

const ids = [
  'G8VbM7B6Zu8cYMwpfRsaoKvuLVsy8p1kYP4VvSdwxWfH',
  '5ZUsD93EbK1SZZa2GXYZx3SjhcXWDvMKqzWoJZjNGkW8',
];
const errorMessage = 'Bad value';

// mock validation
const resultOk = (s: string) => ok<ResolverError, string>(s);
const resultError = (s: string) => error<ResolverError, string>(AppError.Resolver(errorMessage));

const mockPgDriver: PgDriver = {
  many: (query: string) => taskOf<DbError | Timeout, string[]>(query.split('::')),
} as PgDriver;

const commonConfig = {
  emitEvent: () => () => undefined,
  getData: (ids: string[]) =>
    mockPgDriver.many<string>(ids.join('::')).map((results) => results.map(maybeOf)),
  transformInput: ok,
  transformResult: identity,
};

const createMockResolver = (validateResult: ValidateSync<ResolverError, string>) =>
  mget<string[], string[], string, string>({
    ...commonConfig,
    validateResult,
  });

afterEach(() => jest.clearAllMocks());

describe('Resolver', () => {
  it('should return result if all validation pass', (done) => {
    const goodResolver = createMockResolver(resultOk);

    goodResolver(ids)
      .run()
      .listen({
        onResolved: (data) => {
          expect(data).toEqual(ids.map(maybeOf));
          done();
        },
      });
  });

  it('should call db query is everything is ok', (done) => {
    const spiedDbQuery = jest.spyOn(mockPgDriver, 'many');
    const goodResolver = mget<string[], string[], string, string>({
      ...commonConfig,
      validateResult: resultOk,
    });

    goodResolver(ids)
      .run()
      .listen({
        onResolved: () => {
          expect(spiedDbQuery).toBeCalled();
          done();
        },
      });
  });

  it('should take left branch if output validation fails', (done) => {
    const badOutputResolver = createMockResolver(resultError);

    badOutputResolver(ids)
      .run()
      .listen({
        onRejected: (e) => {
          expect(e).toEqual(AppError.Resolver(errorMessage));
          done();
        },
      });
  });
});
