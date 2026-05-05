// @ts-nocheck
import { Either, Option } from 'effect';
import { liftInnerMaybe } from '.';

const validationLeftValue = Either.left<string, number>('Bad value');
const mockValidate = (r: number): Either.Either<string, number> =>
  r === 1 ? Either.right(r) : validationLeftValue;

test('liftInnerMaybe', () => {
  const validateMaybeV = (m: Option.Option<number>) =>
    liftInnerMaybe((v: number) => Either.right(v), mockValidate, m);

  expect(validateMaybeV(Option.some(1))).toEqual(Either.right(Option.some(1)));
  expect(validateMaybeV(Option.some(2))).toEqual(validationLeftValue);
});
