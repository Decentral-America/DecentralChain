import { Either } from 'effect';
import { interval } from '../../../../../types';
import { unsafeIntervalsFromStrings } from '../../../../../utils/interval';
import { highestDividerLessThan } from '../utils';

describe('candles sql helper functions', () => {
  it('highest divider less then', () => {
    expect(
      Either.getOrThrow(
        highestDividerLessThan(
          Either.getOrThrow(interval('1m')),
          unsafeIntervalsFromStrings(['1m', '1h', '1d']),
        ),
      ).length,
    ).toBe(Either.getOrThrow(interval('1m')).length);
    expect(
      Either.getOrThrow(
        highestDividerLessThan(
          Either.getOrThrow(interval('10m')),
          unsafeIntervalsFromStrings(['5m', '15m', '1h']),
        ),
      ).length,
    ).toBe(Either.getOrThrow(interval('5m')).length);
    expect(
      Either.getOrThrow(
        highestDividerLessThan(
          Either.getOrThrow(interval('15m')),
          unsafeIntervalsFromStrings(['5m', '15m', '1h']),
        ),
      ).length,
    ).toBe(Either.getOrThrow(interval('15m')).length);
    expect(
      Either.getOrThrow(
        highestDividerLessThan(
          Either.getOrThrow(interval('1h')),
          unsafeIntervalsFromStrings(['1m', '1h', '1d']),
        ),
      ).length,
    ).toBe(Either.getOrThrow(interval('1h')).length);
  });
});
