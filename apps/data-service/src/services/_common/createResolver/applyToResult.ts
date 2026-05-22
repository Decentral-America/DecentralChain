import { Either, Option } from 'effect';
import { liftInnerOption } from '../../../utils/fp';

/** Sequences Either results over a collection. Left short-circuits. */
const sequenceEither = <A, E>(eithers: Either.Either<A, E>[]): Either.Either<A[], E> => {
  const results: A[] = [];
  for (const e of eithers) {
    if (Either.isLeft(e)) return e as Either.Either<A[], E>;
    results.push(e.right);
  }
  return Either.right(results);
};

export const applyValidation = {
  get:
    <A, E>(fn: (a: A) => Either.Either<A, E>) =>
    (m: Option.Option<A>): Either.Either<Option.Option<A>, E> =>
      liftInnerOption(fn, m),

  mget:
    <A, E>(fn: (a: A) => Either.Either<A, E>) =>
    (ms: Option.Option<A>[]): Either.Either<Option.Option<A>[], E> =>
      sequenceEither(ms.map((m) => liftInnerOption(fn, m))),

  search:
    <A, E>(fn: (a: A) => Either.Either<A, E>) =>
    (as: A[]): Either.Either<A[], E> =>
      sequenceEither(as.map(fn)),
};

export const applyTransformation = {
  get:
    <A, B>(fn: (a: A) => B) =>
    (m: Option.Option<A>): B | null =>
      Option.isSome(m) ? fn(m.value) : null,

  mget:
    <A, B>(fn: (a: A) => B) =>
    (ms: Option.Option<A>[]): (B | null)[] =>
      ms.map(applyTransformation.get(fn)),

  search:
    <A, B>(fn: (a: A) => B) =>
    (as: A[]): B[] =>
      as.map(fn),
};
