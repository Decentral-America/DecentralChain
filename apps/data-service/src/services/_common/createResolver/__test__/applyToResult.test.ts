import { Either, Option } from 'effect';
import { AppError } from '../../../../errorHandling';
import { applyTransformation, applyValidation } from '../applyToResult';

describe('Application of functions to db results', () => {
  describe('validation', () => {
    const validate = (res: number): Either.Either<number, AppError> =>
      res === 2 ? Either.right(2) : Either.left(AppError.Validation('Bad value'));

    describe('Get', () => {
      it('valid result', () => {
        expect(applyValidation.get(validate)(Option.some(2))).toEqual(Either.right(Option.some(2)));
      });
      it('invalid result', () => {
        expect(applyValidation.get(validate)(Option.some(-1))).toEqual(
          Either.left(AppError.Validation('Bad value')),
        );
      });
      it('empty result', () => {
        expect(applyValidation.get(validate)(Option.none())).toEqual(Either.right(Option.none()));
      });
    });

    describe('Mget', () => {
      it('valid results', () => {
        const results = [Option.some(2), Option.none<number>()];
        expect(applyValidation.mget(validate)(results)).toEqual(Either.right(results));
      });
      it('invalid results', () => {
        const results = [Option.none<number>(), Option.some(3)];
        expect(applyValidation.mget(validate)(results)).toEqual(
          Either.left(AppError.Validation('Bad value')),
        );
      });
      it('empty results', () => {
        const results: Option.Option<number>[] = [];
        expect(applyValidation.mget(validate)(results)).toEqual(Either.right([]));
      });
    });

    describe('Search', () => {
      it('valid results', () => {
        const results = [2, 2];
        expect(applyValidation.search(validate)(results)).toEqual(Either.right(results));
      });
      it('invalid results', () => {
        const results = [2, 3];
        expect(applyValidation.search(validate)(results)).toEqual(
          Either.left(AppError.Validation('Bad value')),
        );
      });
      it('empty results', () => {
        const results: number[] = [];
        expect(applyValidation.search(validate)(results)).toEqual(Either.right([]));
      });
    });
  });

  describe('transformation', () => {
    const transform = (res: number) => res.toString();

    describe('Get', () => {
      it('valid result', () => {
        expect(applyTransformation.get(transform)(Option.some(2))).toEqual('2');
      });
      it('empty result', () => {
        expect(applyTransformation.get(transform)(Option.none())).toBeNull();
      });
    });
    describe('Mget', () => {
      it('valid result', () => {
        expect(
          applyTransformation.mget(transform)([Option.some(2), Option.none(), Option.some(3)]),
        ).toEqual(['2', null, '3']);
      });
      it('empty result', () => {
        expect(applyTransformation.mget(transform)([])).toEqual([]);
      });
    });
  });
});
