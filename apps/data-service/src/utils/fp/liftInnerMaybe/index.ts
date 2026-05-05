import { type Task, type of as taskOf } from 'folktale/concurrency/task';

import { type Maybe } from 'folktale/maybe';
import { type Result, type of as resultOf } from 'folktale/result';
import { compose, map } from 'ramda';
import { swapMaybeF } from '../swapMaybeF';

export function liftInnerMaybe<A, B>(
  F: typeof resultOf,
  fn: (b: B) => Result<A, B>,
  maybe: Maybe<B>,
): Result<A, Maybe<B>>;
export function liftInnerMaybe<A, B>(
  F: typeof taskOf,
  fn: (b: B) => Task<A, B>,
  maybe: Maybe<B>,
): Task<A, Maybe<B>>;
export function liftInnerMaybe(F: any, fn: any, maybe: any) {
  return compose((m: any) => swapMaybeF(F, m), map(fn))(maybe) as any;
}
