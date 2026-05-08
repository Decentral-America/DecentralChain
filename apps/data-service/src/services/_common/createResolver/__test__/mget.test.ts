import { Effect, Either, Option } from 'effect';
import { identity } from 'ramda';
import { type PgDriver } from '../../../../db/driver';
import { type DbError, type Timeout } from '../../../../errorHandling';
import { mget } from '../../createResolver';

const ids = [
  'G8VbM7B6Zu8cYMwpfRsaoKvuLVsy8p1kYP4VvSdwxWfH',
  '5ZUsD93EbK1SZZa2GXYZx3SjhcXWDvMKqzWoJZjNGkW8',
];

afterEach(() => vi.clearAllMocks());

describe('Resolver', () => {
  const mockPgDriver = {
    many: (query: string): Effect.Effect<string[], DbError | Timeout> =>
      Effect.succeed(query.split('::')),
  } as unknown as PgDriver;

  const commonConfig = {
    emitEvent: () => () => undefined,
    getData: (ids: string[]) =>
      Effect.map((mockPgDriver as any).many(ids.join('::')), (results: string[]) =>
        results.map((v) => Option.some(v)),
      ),
    transformInput: (r: any) => Either.right(r),
    transformResult: identity as any,
  };

  it('should return result if all validation pass', async () => {
    const resolver = mget({
      ...commonConfig,
      validateResult: (v: string) => Either.right(v),
    } as any);
    const data = await Effect.runPromise(resolver(ids));
    expect(data).toEqual(ids.map(Option.some));
  });

  it('should take left branch if output validation fails', async () => {
    const resolver = mget({
      ...commonConfig,
      validateResult: () => Either.left(new Error('bad') as any),
    } as any);
    await expect(Effect.runPromise(resolver(ids))).rejects.toBeDefined();
  });
});
