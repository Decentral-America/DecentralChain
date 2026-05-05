// @ts-nocheck
import { interval } from '../../../../../types';
import { unsafeIntervalsFromStrings } from '../../../../../utils/interval';
import { highestDividerLessThan } from '../utils';

describe('candles sql helper functions', () => {
  it('highest divider less then', () => {
    expect(
      highestDividerLessThan(
        interval('1m').unsafeGet(),
        unsafeIntervalsFromStrings(['1m', '1h', '1d']),
      ).unsafeGet().length,
    ).toBe(interval('1m').unsafeGet().length);
    expect(
      highestDividerLessThan(
        interval('10m').unsafeGet(),
        unsafeIntervalsFromStrings(['5m', '15m', '1h']),
      ).unsafeGet().length,
    ).toBe(interval('5m').unsafeGet().length);
    expect(
      highestDividerLessThan(
        interval('15m').unsafeGet(),
        unsafeIntervalsFromStrings(['5m', '15m', '1h']),
      ).unsafeGet().length,
    ).toBe(interval('15m').unsafeGet().length);
    expect(
      highestDividerLessThan(
        interval('1h').unsafeGet(),
        unsafeIntervalsFromStrings(['1m', '1h', '1d']),
      ).unsafeGet().length,
    ).toBe(interval('1h').unsafeGet().length);
  });
});
