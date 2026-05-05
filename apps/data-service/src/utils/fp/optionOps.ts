import { Option } from 'effect';

export const isEmpty = <A>(ma: Option.Option<A>): boolean => Option.isNone(ma);

export const isDefined = <A>(ma: Option.Option<A>): boolean => Option.isSome(ma);

export const map2 = <A, B, R>(
  fn: (a: A, b: B) => R,
  ma: Option.Option<A>,
  mb: Option.Option<B>,
): Option.Option<R> => Option.flatMap(ma, (a) => Option.map(mb, (b) => fn(a, b)));

export const forEach = <A>(f: (a: A) => void, ma: Option.Option<A>): void => {
  if (Option.isSome(ma)) f(ma.value);
};
