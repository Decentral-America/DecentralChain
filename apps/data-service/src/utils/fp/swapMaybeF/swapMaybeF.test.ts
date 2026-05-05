// @ts-nocheck
import { Effect, Either, Option } from 'effect';
import { swapMaybeF } from '.';

test('swapMaybeF with Either as F', () => {
  const a = Option.some(Either.right<string, number>(1));
  expect(swapMaybeF(Either.right, a)).toEqual(Either.right(Option.some(1)));
});

test('swapMaybeF with Effect as F', async () => {
  const makeEffect = (v: number) => Effect.succeed(v);
  const a = Option.some(makeEffect(1));
  const result = await Effect.runPromise(swapMaybeF(makeEffect, a));
  const expected = await Effect.runPromise(makeEffect(1).pipe(Effect.map(Option.some)));
  expect(result).toEqual(expected);
});
