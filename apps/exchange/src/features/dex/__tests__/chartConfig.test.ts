/**
 * chartConfig — unit tests
 *
 * Covers the pure parts of the DEX chart: the resolution table, the history
 * window budget and the moving-average maths. These have no chart dependency,
 * so they can be exercised without mounting lightweight-charts.
 */
import { describe, expect, it } from 'vitest';
import {
  CHART_RESOLUTIONS,
  DEFAULT_RESOLUTION,
  historyStartSeconds,
  movingAverage,
  TARGET_BARS,
} from '../chartConfig';

/** Resolutions CandlesService._resolutionToMinutes knows about. */
const SERVICE_KNOWN_RESOLUTIONS = new Set([
  '1',
  '5',
  '15',
  '30',
  '60',
  '120',
  '180',
  '240',
  '360',
  '720',
  'D',
  'W',
  '1D',
  '1W',
]);

describe('CHART_RESOLUTIONS', () => {
  it('only offers resolutions the candles service can map', () => {
    // A value the service does not recognise falls back to one day, which would
    // silently render daily bars under e.g. a "5m" button.
    for (const resolution of CHART_RESOLUTIONS) {
      expect(SERVICE_KNOWN_RESOLUTIONS).toContain(resolution.value);
    }
  });

  it('has a label and a positive bar width for every entry', () => {
    for (const resolution of CHART_RESOLUTIONS) {
      expect(resolution.label).toBeTruthy();
      expect(resolution.minutes).toBeGreaterThan(0);
    }
  });

  it('lists resolutions from finest to coarsest', () => {
    const widths = CHART_RESOLUTIONS.map((r) => r.minutes);
    expect([...widths].sort((a, b) => a - b)).toEqual(widths);
  });

  it('includes the default resolution', () => {
    expect(CHART_RESOLUTIONS.some((r) => r.value === DEFAULT_RESOLUTION)).toBe(true);
  });
});

describe('historyStartSeconds', () => {
  it('covers exactly TARGET_BARS bars of history', () => {
    const to = 1_700_000_000;
    // 60-minute bars: 300 bars back is 300 * 3600 seconds.
    expect(historyStartSeconds(to, 60)).toBe(to - 60 * 60 * TARGET_BARS);
  });

  it('scales the window with the bar width', () => {
    const to = 1_700_000_000;
    const oneMinute = to - historyStartSeconds(to, 1);
    const oneHour = to - historyStartSeconds(to, 60);
    expect(oneHour).toBe(oneMinute * 60);
  });

  it('keeps every offered resolution within one data-service batch', () => {
    // data-service rejects requests spanning more than 1440 candles, and
    // candlesService splits anything larger into that many batches. Requesting
    // a fixed 90-day window at 1m — what this replaced — was 129,600 bars.
    const to = 1_700_000_000;
    for (const resolution of CHART_RESOLUTIONS) {
      const span = to - historyStartSeconds(to, resolution.minutes);
      const bars = span / (resolution.minutes * 60);
      expect(bars).toBeLessThanOrEqual(1440);
    }
  });

  it('honours an explicit bar count', () => {
    const to = 1_700_000_000;
    expect(historyStartSeconds(to, 5, 10)).toBe(to - 5 * 60 * 10);
  });
});

describe('movingAverage', () => {
  const bars = [10, 20, 30, 40, 50].map((close, i) => ({ close, time: i }));

  it('averages over the trailing window', () => {
    // (10+20+30)/3 = 20, (20+30+40)/3 = 30, (30+40+50)/3 = 40
    expect(movingAverage(bars, 3)).toEqual([
      { time: 2, value: 20 },
      { time: 3, value: 30 },
      { time: 4, value: 40 },
    ]);
  });

  it('omits bars with no full window rather than emitting zeroes', () => {
    // Emitting 0 for the first period-1 bars would drag a visible line to the
    // bottom of the price scale.
    const result = movingAverage(bars, 3);
    expect(result).toHaveLength(bars.length - 2);
    expect(result[0]?.time).toBe(2);
  });

  it('returns an empty series when there are fewer bars than the period', () => {
    expect(movingAverage(bars, 10)).toEqual([]);
  });

  it('returns an empty series for a non-positive period', () => {
    expect(movingAverage(bars, 0)).toEqual([]);
    expect(movingAverage(bars, -1)).toEqual([]);
  });

  it('handles a period of one as a passthrough', () => {
    expect(movingAverage(bars, 1)).toEqual(bars.map((b) => ({ time: b.time, value: b.close })));
  });

  it('tracks a rolling window rather than a cumulative sum', () => {
    // Regression guard: a missing subtraction of the dropped bar makes the
    // average climb without bound instead of following price back down.
    const updown = [100, 100, 100, 1, 1, 1].map((close, i) => ({ close, time: i }));
    const result = movingAverage(updown, 3);
    expect(result[result.length - 1]?.value).toBe(1);
  });

  it('is empty for an empty input', () => {
    expect(movingAverage([], 3)).toEqual([]);
  });
});
