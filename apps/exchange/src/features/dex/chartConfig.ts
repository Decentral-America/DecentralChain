/**
 * Chart configuration shared by the DEX price chart.
 *
 * Kept out of the component so the resolution table, the bar-count budget and
 * the moving-average maths can be unit-tested without mounting a chart (and so
 * the component file stays about rendering).
 */

/** A selectable timeframe, in the resolution strings `candlesService` understands. */
export interface ChartResolution {
  /** Button label. */
  label: string;
  /** Resolution string passed to `candlesService.getBars`. */
  value: string;
  /** Bar width in minutes — used to size the history window. */
  minutes: number;
}

/**
 * Selectable timeframes.
 *
 * Every value here must exist in `CandlesService._resolutionToMinutes`, which
 * silently falls back to one day for anything it does not recognise — a wrong
 * entry would quietly render daily bars under a "5m" button. Month is
 * deliberately absent: the service has no mapping for it.
 */
export const CHART_RESOLUTIONS: readonly ChartResolution[] = [
  { label: '1m', minutes: 1, value: '1' },
  { label: '5m', minutes: 5, value: '5' },
  { label: '15m', minutes: 15, value: '15' },
  { label: '30m', minutes: 30, value: '30' },
  { label: '1H', minutes: 60, value: '60' },
  { label: '4H', minutes: 240, value: '240' },
  { label: '1D', minutes: 1440, value: 'D' },
  { label: '1W', minutes: 10080, value: 'W' },
] as const;

export const DEFAULT_RESOLUTION = '60';

/** How the price series is drawn. */
export type ChartType = 'candles' | 'line' | 'area';

/**
 * Bars to request per load.
 *
 * The previous implementation asked for a fixed 90 days at every resolution,
 * which is 129,600 bars at 1m. data-service refuses any request spanning more
 * than 1440 candles, and `candlesService` splits oversized ranges into that
 * many batches — so a 1m request fanned out into ninety HTTP calls to render
 * one screen. Sizing the window by bar count keeps every timeframe to a single
 * batch and still overfills a typical viewport.
 */
export const TARGET_BARS = 300;

/**
 * Start timestamp (seconds) for a history window ending at `toSeconds`.
 *
 * @param toSeconds - End of the window, in seconds.
 * @param minutes - Bar width in minutes.
 * @param bars - How many bars to cover. Defaults to {@link TARGET_BARS}.
 */
export function historyStartSeconds(
  toSeconds: number,
  minutes: number,
  bars: number = TARGET_BARS,
): number {
  return toSeconds - minutes * 60 * bars;
}

/** Moving-average overlays drawn on top of the price series. */
export const MOVING_AVERAGES = [
  { color: '#F59E0B', period: 7 },
  { color: '#8B5CF6', period: 25 },
] as const;

/** A point on a moving-average line. */
export interface MaPoint {
  time: number;
  value: number;
}

/**
 * Simple moving average of `close` over `period` bars.
 *
 * Returns one point per input bar from index `period - 1` onward; earlier bars
 * have no window and are omitted rather than emitted as zero, which would drag
 * a visible line to the bottom of the scale.
 *
 * @param bars - Bars in ascending time order.
 * @param period - Window length in bars.
 */
export function movingAverage(
  bars: ReadonlyArray<{ time: number; close: number }>,
  period: number,
): MaPoint[] {
  if (period <= 0 || bars.length < period) return [];

  const out: MaPoint[] = [];
  let sum = 0;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (!bar) continue;
    sum += bar.close;

    if (i >= period) {
      const dropped = bars[i - period];
      if (dropped) sum -= dropped.close;
    }
    if (i >= period - 1) {
      out.push({ time: bar.time, value: sum / period });
    }
  }

  return out;
}
