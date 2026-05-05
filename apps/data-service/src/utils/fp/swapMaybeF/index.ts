import { type Task, type of as taskOf } from 'folktale/concurrency/task';
import { empty, type Maybe, of as maybeOf } from 'folktale/maybe';
import { type Result, type of as resultOf } from 'folktale/result';

export function swapMaybeF<A, B>(
  F: typeof resultOf,
  maybe: Maybe<Result<A, B>>,
): Result<A, Maybe<B>>;
export function swapMaybeF<A, B>(F: typeof taskOf, maybe: Maybe<Task<A, B>>): Task<A, Maybe<B>>;
export function swapMaybeF(F: any, maybe: Maybe<any>): any {
  return maybe.matchWith({
    Just: ({ value }) => value.map(maybeOf),
    Nothing: () => F(empty()),
  });
}
