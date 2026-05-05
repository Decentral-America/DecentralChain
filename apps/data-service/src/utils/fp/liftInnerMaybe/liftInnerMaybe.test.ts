import { type Maybe, of as maybeOf } from 'folktale/maybe';
import { Error, of as resultOf } from 'folktale/result';

import { liftInnerMaybe } from '.';

const validationLeftValue = Error<string, number>('Bad value');
const mockValidate = (r: number) => (r === 1 ? resultOf<string, number>(r) : validationLeftValue);

test('liftInnerM', () => {
  const validateMaybeV = (m: Maybe<number>) => liftInnerMaybe(resultOf, mockValidate, m);

  expect(validateMaybeV(maybeOf(1))).toEqual(resultOf(maybeOf(1)));
  expect(validateMaybeV(maybeOf(2))).toEqual(validationLeftValue);
});
