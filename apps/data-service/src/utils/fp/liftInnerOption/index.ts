import { type Either, Option, pipe } from 'effect';
import { swapOptionEither } from '../swapOptionF';

/**
 * Applies fn to the value inside Option, then sequences.
 *   None            → Right(None)
 *   Some(a), fn(a)=Right(b) → Right(Some(b))
 *   Some(a), fn(a)=Left(e)  → Left(e)
 */
export const liftInnerOption = <E, A>(
  fn: (a: A) => Either.Either<E, A>,
  option: Option.Option<A>,
): Either.Either<E, Option.Option<A>> => swapOptionEither(pipe(option, Option.map(fn)));
