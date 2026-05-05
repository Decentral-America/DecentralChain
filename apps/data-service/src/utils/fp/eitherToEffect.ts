import { Effect, Either } from 'effect';

/** Converts an Either<A, E> to an Effect<A, E>. Success in A position, error in E position. */
export const eitherToEffect = <A, E>(e: Either.Either<A, E>): Effect.Effect<A, E> =>
  Either.isRight(e) ? Effect.succeed(e.right) : Effect.fail(e.left);
