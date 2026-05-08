import { Effect, Either, Option, pipe } from 'effect';

/**
 * Swaps Option<Either<E,A>> → Either<E, Option<A>>.
 * None  → Right(None)
 * Some(Right(a)) → Right(Some(a))
 * Some(Left(e))  → Left(e)
 */
export const swapOptionEither = <E, A>(
  optEither: Option.Option<Either.Either<E, A>>,
): Either.Either<E, Option.Option<A>> =>
  Option.match(optEither, {
    onNone: () => Either.right(Option.none<A>()) as unknown as Either.Either<E, Option.Option<A>>,
    onSome: (either) => pipe(either, Either.map(Option.some)),
  }) as unknown as Either.Either<E, Option.Option<A>>;

/**
 * Swaps Option<Effect<A,E>> → Effect<Option<A>, E>.
 * None       → succeed(None)
 * Some(eff)  → eff.map(Some)
 */
export const swapOptionEffect = <A, E>(
  optEffect: Option.Option<Effect.Effect<A, E>>,
): Effect.Effect<Option.Option<A>, E> =>
  Option.match(optEffect, {
    onNone: () => Effect.succeed(Option.none()),
    onSome: (eff) => pipe(eff, Effect.map(Option.some)),
  });
