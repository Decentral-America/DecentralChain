import { Either, Option } from 'effect';
import { liftInnerMaybe } from '.';

const validationLeftValue: Either.Either<number, string> = Either.left('Bad value');
const mockValidate = (r: number): Either.Either<number, string> =>
  r === 1 ? Either.right(r) : validationLeftValue;

test('liftInnerMaybe', () => {
  expect(liftInnerMaybe(mockValidate as any, Option.some(1))).toEqual(Either.right(Option.some(1)));
  expect(liftInnerMaybe(mockValidate as any, Option.some(2))).toEqual(validationLeftValue);
});
