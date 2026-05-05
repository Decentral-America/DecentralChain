import { BigNumber } from '@decentralchain/data-entities';
import { Option, pipe } from 'effect';

export function safeDivide(n1: BigNumber, n2: BigNumber): Option.Option<BigNumber> {
  return pipe(
    Option.some(n2),
    Option.filter((it) => !it.isZero()),
    Option.map((it) => n1.div(it)),
  );
}

export const inv = (n: BigNumber) => safeDivide(new BigNumber(1), n);

export const invOnSatoshi = (n: BigNumber, precision: number) =>
  safeDivide(new BigNumber(10 ** precision), n);

export type Deconstruct<T, Components> = (value: T) => Components;

export const isSymmetric =
  <T, P>(byFn: Deconstruct<T, [P, P]>) =>
  (item: T) => {
    const [p1, p2] = byFn(item);
    return p1 === p2;
  };
