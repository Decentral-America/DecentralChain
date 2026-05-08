import { Either } from 'effect';
import { div, fromMilliseconds } from '../../utils/interval';
import { interval } from '../interval';

describe('Interval', () => {
  const i = interval('180s');

  describe('from method', () => {
    it('should return Either.Right if correct args are given', () => {
      const i = interval('10s');
      expect(Either.isRight(i) ? i.right.length : null).toBe(10000);
    });

    it('should return Either.Left if wrong args are given', () => {
      const i = interval('1.5s');
      expect(Either.isLeft(i) ? null : i.right).toBe(null);
    });
  });

  describe('length', () => {
    it('should keep its length in milliseconds', () => {
      expect(Either.isRight(i) ? i.right.length : null).toBe(180000);
      const h = interval('1h');
      expect(Either.isRight(h) ? h.right.length : null).toBe(3600000);
    });
  });

  describe('div method', () => {
    it('should be divisible by another Interval', () => {
      const i2 = interval('1m');
      expect(Either.isRight(i) && Either.isRight(i2) ? div(i.right, i2.right) : null).toBe(3);
    });
  });

  describe('fromMilliseconds method', () => {
    it('should return Either.Right if correct args are given', () => {
      const i = fromMilliseconds(900000);
      expect(Either.isRight(i) ? i.right.length : null).toBe(900000);
    });

    it('should return Either.Right for large value', () => {
      const i = fromMilliseconds(3196800000);
      expect(Either.isRight(i) ? i.right.length : null).toBe(3196800000);
    });

    it('should return Either.Right for very large value', () => {
      const i = fromMilliseconds(1960588800000);
      expect(Either.isRight(i) ? i.right.length : null).toBe(1960588800000);
    });

    it('should return Either.Left if wrong args are given', () => {
      const i = fromMilliseconds(2500);
      expect(Either.isLeft(i) ? null : i.right).toBe(null);
    });
  });
});
