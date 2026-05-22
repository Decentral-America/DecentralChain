import { type Either, Option, pipe } from 'effect';
import { swapOptionEither } from '../swapOptionF';

/**
 * Applies fn to the value inside Option, then sequences.
 *   None            → Right(None)
 *   Some(a), fn(a)=Right(b) → Right(Some(b))
 *   Some(a), fn(a)=Left(e)  → Left(e)
 */
export const liftInnerOption = <A, E>(
  fn: (a: A) => Either.Either<A, E>,
  option: Option.Option<A>,
): Either.Either<Option.Option<A>, E> => swapOptionEither(pipe(option, Option.map(fn)));
