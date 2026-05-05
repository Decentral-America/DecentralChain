import { Either } from 'effect';
import { ValidationError } from '../errorHandling';
import { interval as intervalRegex } from '../utils/regex';

export const Unit = {
  Day: 'd',
  Hour: 'h',
  Minute: 'm',
  Month: 'M',
  Second: 's',
  Week: 'w',
  Year: 'Y',
} as const;
export type Unit = (typeof Unit)[keyof typeof Unit];

export const units: Record<Unit, number> = {
  [Unit.Second]: 1,
  [Unit.Minute]: 60,
  [Unit.Hour]: 60 * 60,
  [Unit.Day]: 60 * 60 * 24,
  [Unit.Week]: 60 * 60 * 24 * 7,
  [Unit.Month]: 60 * 60 * 24 * 31,
  [Unit.Year]: 60 * 60 * 24 * 31 * 366,
};

export const parseUnit = (s: string): Either.Either<Unit, ValidationError> => {
  switch (s.slice(-1)) {
    case Unit.Second:
      return Either.right(Unit.Second);
    case Unit.Minute:
      return Either.right(Unit.Minute);
    case Unit.Hour:
      return Either.right(Unit.Hour);
    case Unit.Day:
      return Either.right(Unit.Day);
    case Unit.Week:
      return Either.right(Unit.Week);
    case Unit.Month:
      return Either.right(Unit.Month);
    case Unit.Year:
      return Either.right(Unit.Year);
    default:
      return Either.left(new ValidationError(`Provided string (${s}) is not a valid unit`));
  }
};

/** Calculates interval length in milliseconds **/
const parseLength = (s: string, unit: Unit): Either.Either<number, ValidationError> => {
  const sub = s.slice(0, s.length - 1);
  const n = parseInt(sub, 10);
  return !Number.isNaN(n)
    ? Either.right(n * units[unit] * 1000)
    : Either.left(new ValidationError(`Provided string (${s}) is not a valid interval length`));
};

export type Interval = {
  length: number;
  unit: Unit;
  source: string;
};

export const interval = (s: string): Either.Either<Interval, ValidationError> => {
  if (!intervalRegex.test(s)) {
    return Either.left(new ValidationError(`Provided string (${s}) is not a valid interval`));
  }
  return Either.flatMap(parseUnit(s), (unit) =>
    Either.map(parseLength(s, unit), (length) => ({ length, source: s, unit })),
  );
};

export const CandleInterval = {
  Day1: '1d',
  Hour1: '1h',
  Hour2: '2h',
  Hour3: '3h',
  Hour4: '4h',
  Hour6: '6h',
  Hour12: '12h',
  Minute1: '1m',
  Minute5: '5m',
  Minute15: '15m',
  Minute30: '30m',
  Month1: '1M',
  Week1: '1w',
} as const;
export type CandleInterval = (typeof CandleInterval)[keyof typeof CandleInterval];
