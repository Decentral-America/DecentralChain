// @ts-nocheck
import { Effect, Option } from 'effect';
import { identity } from 'ramda';
import { type PgDriver } from '../../../../db/driver';
import { AppError } from '../../../../errorHandling';
import { get } from '..';

const assetId = 'G8VbM7B6Zu8cYMwpfRsaoKvuLVsy8p1kYP4VvSdwxWfH';

const _resultOk = (s: string) => Effect.succeed(s);
const _resultError = (s: string) => Effect.fail(AppError.Resolver(s));

afterEach(() => vi.clearAllMocks());

describe('Resolver', () => {
  const mockPgDriver = {
    oneOrNone: (s: string) => Effect.succeed<string | null>(s),
  } as unknown as PgDriver;

  const commonConfig = {
    emitEvent: () => () => undefined,
    getData: (id: string) =>
      Effect.map((mockPgDriver as any).oneOrNone<string>(id), (v: string | null) =>
        Option.fromNullable(v),
      ),
    transformInput: (r) => Either.right(r),
    transformResult: identity,
  };

  it('should return result if all validation pass', async () => {
    const resolver = get<string, string, string, string>({
      ...commonConfig,
      validateResult: () => Effect.succeed('placeholder'),
    });

    const data = await Effect.runPromise(resolver(assetId));
    expect(Option.isSome(data) ? data.value : null).toEqual(assetId);
  });

  it('should take left branch if output validation fails', async () => {
    const resolver = get<string, string, string, string>({
      ...commonConfig,
      validateResult: () => Effect.fail(AppError.Resolver(assetId)),
    });

    await expect(Effect.runPromise(resolver(assetId))).rejects.toBeDefined();
  });
});
