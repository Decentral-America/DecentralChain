import { Effect, Either, Option, pipe } from 'effect';

/**
 * Swaps Option<Either<A,E>> → Either<Option<A>, E>.
 * None            → Right(None)
 * Some(Right(a))  → Right(Some(a))
 * Some(Left(e))   → Left(e)
 */
export const swapOptionEither = <A, E>(
  optEither: Option.Option<Either.Either<A, E>>,
): Either.Either<Option.Option<A>, E> =>
  Option.match(optEither, {
    onNone: () => Either.right(Option.none<A>()),
    onSome: (either) => pipe(either, Either.map(Option.some)),
  });

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
