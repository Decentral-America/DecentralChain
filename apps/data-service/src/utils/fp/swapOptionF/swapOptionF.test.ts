import { Effect, Either, Option } from 'effect';
import { swapOptionEffect, swapOptionEither } from '../swapOptionF';

test('swapMaybeF with Either (swapOptionEither)', () => {
  const a = Option.some(Either.right(1) as unknown as Either.Either<string, number>);
  expect(swapOptionEither(a)).toEqual(Either.right(Option.some(1)));
});

test('swapMaybeF with Effect (swapOptionEffect)', async () => {
  const makeEffect = (v: number) => Effect.succeed(v);
  const a = Option.some(makeEffect(1));
  const result = await Effect.runPromise(swapOptionEffect(a));
  const expected = await Effect.runPromise(makeEffect(1).pipe(Effect.map(Option.some)));
  expect(result).toEqual(expected);
});
