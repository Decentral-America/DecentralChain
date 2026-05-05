import { Error as error, Ok as ok, type Result } from 'folktale/result';
import { findLast } from 'ramda';
import { ValidationError } from '../../../../errorHandling';
import { type Interval } from '../../../../types';
import { div } from '../../../../utils/interval';

export const highestDividerLessThan = (
  inter: Interval,
  dividers: Interval[],
): Result<ValidationError, Interval> => {
  const i = findLast((i: Interval) => div(inter, i) >= 1, dividers);
  return i ? ok(i) : error(new ValidationError('Divider not found'));
};
