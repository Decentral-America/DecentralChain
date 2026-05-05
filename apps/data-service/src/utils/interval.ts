import { Either, pipe } from 'effect';
import { findLastIndex, values } from 'ramda';
import { ValidationError } from '../errorHandling';
import { type Interval, interval, parseUnit, units } from '../types/interval';

export const div = (a: Interval, b: Interval): number => a.length / b.length;

export const unsafeIntervalsFromStrings = (strs: string[]): Interval[] =>
  strs.map((s) => Either.getOrThrow(interval(s)));

export const fromMilliseconds = (
  milliseconds: number,
): Either.Either<Interval, ValidationError> => {
  const secs = milliseconds / 1000;
  const unitsValues = values(units);
  let unitIndex = findLastIndex((x: number) => x >= secs && secs % x === 0)(unitsValues);
  if (!~unitIndex) unitIndex = 0;

  return pipe(
    parseUnit(Object.keys(units)[unitIndex] as string),
    Either.flatMap((unit) => {
      const length = (secs / units[unit as keyof typeof units]) as number;
      if (length % 1 === 0) {
        return Either.right({ length: milliseconds, source: `${length}${unit}`, unit });
      } else {
        return Either.left(
          new ValidationError(`Cannot convert ${milliseconds}ms to a clean interval`),
        );
      }
    }),
  );
};
