import { Either } from 'effect';
import { findLast } from 'ramda';
import { ValidationError } from '../../../../errorHandling';
import { type Interval } from '../../../../types';
import { div } from '../../../../utils/interval';

export const highestDividerLessThan = (
  inter: Interval,
  dividers: Interval[],
): Either.Either<Interval, ValidationError> => {
  const i = findLast((i: Interval) => div(inter, i) >= 1, dividers);
  return i ? Either.right(i) : Either.left(new ValidationError('Divider not found'));
};
