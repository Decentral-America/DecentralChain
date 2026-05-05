import { rejected, type Task, of as taskOf } from 'folktale/concurrency/task';
import { type Result } from 'folktale/result';

export const resultToTask = <A, B>(r: Result<A, B>): Task<A, B> =>
  r.matchWith({
    Error: ({ value }) => rejected<A, B>(value),
    Ok: ({ value }) => taskOf<A, B>(value),
  });
