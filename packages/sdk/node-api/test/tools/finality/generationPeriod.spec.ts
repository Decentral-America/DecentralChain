import { describe, expect, it } from 'vitest';
import {
  generationPeriodEnd,
  generationPeriodFrom,
  generationPeriodNext,
  toGenerationPeriodBounds,
} from '../../../src/tools/finality/generationPeriod';

/**
 * Unit tests for the pure port of node-scala's `GenerationPeriod`
 * (`node/src/main/scala/com/decentralchain/state/GenerationPeriod.scala`).
 *
 * No fetch/network involved — this is why the algorithm lives under
 * `tools/finality/` rather than `api-node/finality/` (see that module's
 * docstring). Expected values below were hand-derived by walking the real
 * Scala `from`/`end`/`next` implementation for each case (see comments).
 */
describe('generationPeriod – port of node-scala GenerationPeriod', () => {
  describe('generationPeriodFrom', () => {
    it('returns null when height is below the activation height', () => {
      expect(generationPeriodFrom(99, 100, 1000)).toBeNull();
    });

    it('the zero period starts exactly at the activation height', () => {
      // h === activation: blockAfterActivation = 0, periodIndex = trunc(-1/1000) = 0
      const period = generationPeriodFrom(100, 100, 1000);
      expect(period).toEqual({ activation: 100, length: 1000, start: 100 });
    });

    it('the zero period covers [activation, activation + length] inclusive', () => {
      // h = activation + length: blockAfterActivation = 1000, periodIndex = trunc(999/1000) = 0
      const period = generationPeriodFrom(1100, 100, 1000);
      expect(period).toEqual({ activation: 100, length: 1000, start: 100 });
      expect(generationPeriodEnd(period as NonNullable<typeof period>)).toBe(1100);
    });

    it('period 1 starts exactly one block after the zero period ends', () => {
      // h = activation + length + 1: blockAfterActivation = 1001, periodIndex = trunc(1000/1000) = 1
      // start = activation + 1*1000 + 1 = 1101
      const period = generationPeriodFrom(1101, 100, 1000);
      expect(period).toEqual({ activation: 100, length: 1000, start: 1101 });
      // Non-zero period: end = start + length - 1 = 1101 + 1000 - 1 = 2100
      expect(generationPeriodEnd(period as NonNullable<typeof period>)).toBe(2100);
    });

    it('period 1 covers exactly `length` blocks (unlike the zero period)', () => {
      const start = generationPeriodFrom(1101, 100, 1000) as NonNullable<
        ReturnType<typeof generationPeriodFrom>
      >;
      const end = generationPeriodFrom(2100, 100, 1000) as NonNullable<
        ReturnType<typeof generationPeriodFrom>
      >;
      expect(end.start).toBe(start.start);
      expect(generationPeriodEnd(end)).toBe(2100);

      // One block further belongs to period 2.
      const next = generationPeriodFrom(2101, 100, 1000) as NonNullable<
        ReturnType<typeof generationPeriodFrom>
      >;
      expect(next.start).toBe(2101);
    });

    it('handles generationPeriodLength === 1 at the activation-height edge case', () => {
      // The Scala Int-division truncation-vs-floor discrepancy only bites at
      // h === activation; length === 1 is the case where trunc and floor of
      // (blockAfterActivation - 1)/length actually diverge in raw value
      // (-1 vs -1, same here) but the formula must still resolve to `activation`.
      const period = generationPeriodFrom(100, 100, 1);
      expect(period).toEqual({ activation: 100, length: 1, start: 100 });
    });

    it('rejects a non-positive generationPeriodLength', () => {
      expect(() => generationPeriodFrom(100, 100, 0)).toThrow(/positive integer/);
      expect(() => generationPeriodFrom(100, 100, -5)).toThrow(/positive integer/);
    });

    it('rejects a non-integer generationPeriodLength', () => {
      expect(() => generationPeriodFrom(100, 100, 10.5)).toThrow(/positive integer/);
    });
  });

  describe('generationPeriodEnd', () => {
    it('the zero period end includes one extra block (offset 0)', () => {
      expect(generationPeriodEnd({ activation: 100, length: 1000, start: 100 })).toBe(1100);
    });

    it('a non-zero period end excludes the extra block (offset -1)', () => {
      expect(generationPeriodEnd({ activation: 100, length: 1000, start: 1101 })).toBe(2100);
    });
  });

  describe('generationPeriodNext', () => {
    it('starts exactly one block after the previous period ends (zero -> period 1)', () => {
      const zero = generationPeriodFrom(100, 100, 1000) as NonNullable<
        ReturnType<typeof generationPeriodFrom>
      >;
      const next = generationPeriodNext(zero);
      expect(next).toEqual({ activation: 100, length: 1000, start: 1101 });
    });

    it('starts exactly one block after the previous period ends (period 1 -> period 2)', () => {
      const period1 = generationPeriodFrom(1101, 100, 1000) as NonNullable<
        ReturnType<typeof generationPeriodFrom>
      >;
      const next = generationPeriodNext(period1);
      expect(next).toEqual({ activation: 100, length: 1000, start: 2101 });
      expect(generationPeriodEnd(next)).toBe(3100);
    });

    it('is consistent with recomputing `from` at the next start height', () => {
      const period1 = generationPeriodFrom(1101, 100, 1000) as NonNullable<
        ReturnType<typeof generationPeriodFrom>
      >;
      const next = generationPeriodNext(period1);
      const recomputed = generationPeriodFrom(next.start, 100, 1000);
      expect(recomputed).toEqual(next);
    });
  });

  describe('toGenerationPeriodBounds', () => {
    it('projects to the public { start, end } shape', () => {
      const period = generationPeriodFrom(100, 100, 1000) as NonNullable<
        ReturnType<typeof generationPeriodFrom>
      >;
      expect(toGenerationPeriodBounds(period)).toEqual({ end: 1100, start: 100 });
    });
  });
});
