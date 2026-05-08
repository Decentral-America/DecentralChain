import { Effect, Either, Option } from 'effect';
import { identity } from 'ramda';
import { type PgDriver } from '../../../../db/driver';
import { get } from '..';

const assetId = 'G8VbM7B6Zu8cYMwpfRsaoKvuLVsy8p1kYP4VvSdwxWfH';

afterEach(() => vi.clearAllMocks());

describe('Resolver', () => {
  const mockPgDriver = {
    oneOrNone: (s: string) => Effect.succeed<string | null>(s),
  } as unknown as PgDriver;

  const commonConfig = {
    emitEvent: () => () => undefined,
    getData: (id: string) =>
      Effect.map((mockPgDriver as any).oneOrNone(id), (v: string | null) => Option.fromNullable(v)),
    transformInput: (r: any) => Either.right(r),
    transformResult: identity as any,
  };

  it('should return result if all validation pass', async () => {
    const resolver = get({
      ...commonConfig,
      validateResult: (v: string) => Either.right(v),
    } as any);

    const data = await Effect.runPromise(resolver(assetId));
    expect(Option.isSome(data) ? data.value : null).toEqual(assetId);
  });

  it('should take left branch if output validation fails', async () => {
    const resolver = get({
      ...commonConfig,
      validateResult: () => Either.left(new Error('bad') as any),
    } as any);

    await expect(Effect.runPromise(resolver(assetId))).rejects.toBeDefined();
  });
});
