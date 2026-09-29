/**
 * Price chart on lightweight-charts v5 — TradingView's open-source MIT library.
 * https://github.com/tradingview/lightweight-charts
 *
 * Three lifecycles, kept apart on purpose:
 *
 *   1. The chart itself, created once per pair + timeframe, which is the only
 *      thing that needs new data.
 *   2. Theme, chart type and moving averages, applied to the *live* chart from
 *      the bars already in hand. These used to tear the chart down and refetch
 *      candles — toggling MA was a network round-trip and a flash of empty
 *      canvas. Now they are a series swap.
 *   3. Drawings, which attach to the price series and so re-attach when it is
 *      swapped, but never refetch either.
 */
import {
  AreaChart,
  CandlestickChart,
  CloseFullscreen,
  OpenInFull,
  ShowChart,
} from '@mui/icons-material';
import {
  Box,
  ButtonBase,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  AreaSeries,
  type AutoscaleInfo,
  CandlestickSeries,
  type ChartOptions,
  ColorType,
  createChart,
  type DeepPartial,
  HistogramSeries,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  LineSeries,
  LineStyle,
  PriceScaleMode,
  type UTCTimestamp,
} from 'lightweight-charts';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getExchangeTxList } from '@/lib/data-service/api/transactions/transactions';
import { logger } from '@/lib/logger';
import { candlesService, MAX_RESOLUTION } from '@/services/candlesService';
import { selectSelectedPair, useDexStore } from '@/stores/dexStore';
import { tokens } from '@/theme/tokens/semantic';
import { applyChartTheme, chartColors } from './chart-plugins/constants';
import {
  CHART_RESOLUTIONS,
  DEFAULT_RESOLUTION,
  historyStartSeconds,
  MOVING_AVERAGES,
  movingAverage,
} from './chartConfig';
import { DrawingToolbar } from './DrawingToolbar';
import { Segmented } from './terminal/Segmented';
import { alpha, direction, NUM, REDUCED, T_FAST, TOOLBAR_H } from './terminal/terminalTokens';
import { useChartDrawings } from './useChartDrawings';

type ChartType = 'candles' | 'line' | 'area';
type PriceSeries = ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'>;

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
interface LegendValues extends Bar {
  changePercent: number | null;
}

const LIVE_REFRESH_MS = 15_000;
const MAX_MINUTES_FOR_DAY_LINES = 240;
const DEEP_HISTORY_SECONDS = 2 * 365 * 24 * 60 * 60;
const LEGEND_H = 24;

/**
 * The newest bar this pair+timeframe produced last time, so a thin market's
 * next load asks for the window that has data instead of the recent one that
 * does not — one request where the fallback path is thirteen. Session-scoped:
 * it is a hint about where the data is, not the data.
 */
/**
 * How many bars the chart opens on, and how many the loader must have before it
 * stops asking for history. Measured, not guessed: swept 40→250 bars against a
 * thin market at two viewport heights, and 80–100 is the peak — wider drags in
 * older, wilder prices that stretch the axis; narrower leaves too few bars for
 * the robust scale to tell an outlier from the market.
 */
const OPEN_WINDOW = 90;

const lastBarKey = (pair: string, res: string) => `dex.lastBar.${pair}.${res}`;
const readLastBar = (pair: string, res: string): number | null => {
  try {
    const v = localStorage.getItem(lastBarKey(pair, res));
    if (!v) return null;
    const n = Number(v);
    return n > 1e11 ? Math.floor(n / 1000) : n;
  } catch {
    return null;
  }
};
const writeLastBar = (pair: string, res: string, t: number) => {
  try {
    localStorage.setItem(lastBarKey(pair, res), String(t));
  } catch {
    /* private mode */
  }
};

/**
 * A price range that one bad print cannot dictate.
 *
 * These markets are thin enough that a single unit can trade at several times
 * the going rate. CRC/DCC's newest candle is one unit at 4.50 against months
 * near 1.30, and letting it set the axis rendered every real candle three
 * pixels tall — a flat line where a chart should be.
 *
 * So the axis is scaled to the 2nd–98th percentile of what is on screen, and
 * only when the full range is more than twice that robust range: an ordinary
 * market never reaches the test, and the outlier still draws, clipped at the
 * edge, rather than being hidden or silently dropped.
 */
const quantile = (sorted: readonly number[], p: number): number =>
  sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)))] ?? 0;

function robustRange(bars: readonly Bar[]): { max: number; min: number } | null {
  if (bars.length < 20) return null;
  const lows = bars
    .map((b) => b.low)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  const highs = bars
    .map((b) => b.high)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  if (lows.length < 20 || highs.length < 20) return null;
  const lo = quantile(lows, 0.02);
  const hi = quantile(highs, 0.98);
  const fullLo = lows[0] ?? lo;
  const fullHi = highs[highs.length - 1] ?? hi;
  if (lo <= 0 || hi <= lo) return null;
  // Leave an honest market alone.
  if (fullHi / Math.max(fullLo, 1e-12) < (hi / lo) * 2) return null;
  const pad = (hi - lo) * 0.08;
  return { max: hi + pad, min: Math.max(0, lo - pad) };
}

const fmt = (value: number) => value.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');

export const TradingViewChart: React.FC<{ leading?: ReactNode }> = ({ leading }) => {
  const theme = useTheme();
  const t = tokens(theme.palette.mode);
  const dir = useMemo(() => direction(theme), [theme]);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<PriceSeries | null>(null);
  const priceKindRef = useRef<ChartType>('candles');
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const maSeriesRef = useRef<ISeriesApi<'Line'>[]>([]);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const barsRef = useRef<Bar[]>([]);
  const detachDrawingsRef = useRef<() => void>(() => {});

  const selectedPair = useDexStore(selectSelectedPair);
  const [resolution, setResolution] = useState<string>(DEFAULT_RESOLUTION);
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [showMa, setShowMa] = useState(true);
  /*
   * Logarithmic price scale.
   *
   * Not a nicety on this chain: CRC/DCC holds a candle that traded at
   * 0.0000021 and another whose high is 20.32 — a 3.9-million-fold range. On a
   * linear axis that single dust print flattens every ordinary candle into a
   * hairline the moment you zoom out past it. Log is the standard answer and
   * the reader's choice is remembered.
   */
  const [logScale, setLogScale] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dex.logScale') === '1';
    } catch {
      return false;
    }
  });
  /*
   * Whether the reader has ever pressed LOG. Until they do, the scale is chosen
   * from the data: a window whose high is several times its low renders every
   * ordinary candle as a hairline on a linear axis, because the move dwarfs
   * them. CRC/DCC's last trade was 4.50 against a 1.30 body of history — 1.8px
   * candles linear, 3.5px log. Once the reader picks, their choice stands.
   */
  const logChosenRef = useRef<boolean>(
    (() => {
      try {
        return localStorage.getItem('dex.logScale') !== null;
      } catch {
        return false;
      }
    })(),
  );
  const [fullscreen, setFullscreen] = useState(false);
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'empty' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [legend, setLegend] = useState<LegendValues | null>(null);
  /*
   * The highest price in view that the robust scale left off the top, if any.
   * A candle drawn off-screen with nothing said about it is a lie of omission —
   * the reader has to know the market printed higher than the axis admits.
   */
  const [clippedHigh, setClippedHigh] = useState<number | null>(null);

  // Live values for the effects that must not re-run when these change.
  const themeRef = useRef(theme);
  const dirRef = useRef(dir);
  const chartTypeRef = useRef(chartType);
  const showMaRef = useRef(showMa);
  const logRef = useRef(logScale);
  useEffect(() => {
    themeRef.current = theme;
    dirRef.current = dir;
  }, [theme, dir]);
  useEffect(() => {
    chartTypeRef.current = chartType;
  }, [chartType]);
  useEffect(() => {
    showMaRef.current = showMa;
  }, [showMa]);
  useEffect(() => {
    logRef.current = logScale;
  }, [logScale]);

  const amountName = selectedPair?.amountAssetName || selectedPair?.amountAsset || '';
  const priceName = selectedPair?.priceAssetName || selectedPair?.priceAsset || '';
  const resolutionMinutes = useMemo(
    () => CHART_RESOLUTIONS.find((r) => r.value === resolution)?.minutes ?? 60,
    [resolution],
  );
  const resolutionLabel = CHART_RESOLUTIONS.find((r) => r.value === resolution)?.label ?? '';

  const pairKey = `${selectedPair?.amountAsset ?? ''}/${selectedPair?.priceAsset ?? ''}`;
  const drawings = useChartDrawings(pairKey, theme, resolution);
  const drawingsRef = useRef(drawings);
  useEffect(() => {
    drawingsRef.current = drawings;
  }, [drawings]);

  const buildSymbolInfo = useCallback(() => {
    if (!selectedPair) return null;
    return {
      _dccData: {
        amountAsset: { id: selectedPair.amountAsset },
        priceAsset: { id: selectedPair.priceAsset },
      },
      name: `${selectedPair.amountAsset}/${selectedPair.priceAsset}`,
    };
  }, [selectedPair]);

  const toBars = useCallback((raw: Parameters<Parameters<typeof candlesService.getBars>[3]>[0]) => {
    return raw
      .filter((b) => b.open != null && b.close != null && b.high != null && b.low != null)
      .map((b) => ({
        close: b.close as number,
        high: b.high as number,
        low: b.low as number,
        open: b.open as number,
        // The data service stamps candles in milliseconds; the chart reads seconds.
        // Read as seconds, a millisecond stamp lands in year 57,000.
        time:
          (b.time as number) > 1e11 ? Math.floor((b.time as number) / 1000) : (b.time as number),
        volume: b.volume ?? 0,
      }))
      .sort((a, b) => a.time - b.time);
  }, []);

  /* ────────────── option builders, all from the live theme ────────────── */

  const chartOptions = useCallback((minutes: number): DeepPartial<ChartOptions> => {
    const th = themeRef.current;
    const tk = tokens(th.palette.mode);
    return {
      autoSize: true,
      crosshair: {
        horzLine: {
          color: tk.text.tertiary,
          labelBackgroundColor: tk.accent.primary,
          style: LineStyle.Dashed,
          width: 1,
        },
        vertLine: {
          color: tk.text.tertiary,
          labelBackgroundColor: tk.accent.primary,
          style: LineStyle.Dashed,
          width: 1,
        },
      },
      grid: {
        horzLines: { color: alpha(tk.border.subtle, 0.7) },
        vertLines: { color: alpha(tk.border.subtle, 0.45) },
      },
      layout: {
        attributionLogo: false,
        background: { color: th.palette.background.paper, type: ColorType.Solid },
        fontFamily: NUM.fontFamily as string,
        fontSize: 11,
        textColor: tk.text.tertiary,
      },
      rightPriceScale: {
        borderVisible: false,
        // Built with the mode already set, so a remount never flashes linear.
        mode: logRef.current ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
        // The volume overlay used to take 22% of the pane. On a market whose
        // candles are already two pixels tall, that 22% is the difference
        // between a candle and a line: 14% gives the price series 41 more
        // pixels and volume still reads at a glance.
        scaleMargins: { bottom: 0.14, top: 0.06 },
      },
      timeScale: {
        borderVisible: false,
        rightOffset: 6,
        secondsVisible: false,
        timeVisible: minutes < 1440,
      },
    };
  }, []);

  const makePriceSeries = useCallback((chart: IChartApi, kind: ChartType): PriceSeries => {
    const th = themeRef.current;
    const d = dirRef.current;
    const accent = th.palette.primary.main;
    const autoscaleInfoProvider = (original: () => AutoscaleInfo | null): AutoscaleInfo | null => {
      const base = original();
      const range = chartRef.current?.timeScale().getVisibleLogicalRange();
      const bars = barsRef.current;
      if (!range || bars.length === 0) return base;
      const robust = robustRange(
        bars.slice(Math.max(0, Math.floor(range.from)), Math.min(bars.length, Math.ceil(range.to))),
      );
      return robust ? { priceRange: { maxValue: robust.max, minValue: robust.min } } : base;
    };
    if (kind === 'candles') {
      return chart.addSeries(CandlestickSeries, {
        autoscaleInfoProvider,
        borderVisible: false,
        downColor: d.down,
        upColor: d.up,
        wickDownColor: d.down,
        wickUpColor: d.up,
      });
    }
    if (kind === 'line') {
      return chart.addSeries(LineSeries, {
        autoscaleInfoProvider,
        color: accent,
        crosshairMarkerRadius: 3,
        lineWidth: 2,
      });
    }
    return chart.addSeries(AreaSeries, {
      autoscaleInfoProvider,
      bottomColor: alpha(accent, 0.02),
      lineColor: accent,
      lineWidth: 2,
      topColor: alpha(accent, 0.28),
    });
  }, []);

  const makeMaSeries = useCallback((chart: IChartApi) => {
    return MOVING_AVERAGES.map((ma) =>
      chart.addSeries(LineSeries, {
        color: ma.color,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        lineWidth: 1,
        priceLineVisible: false,
      }),
    );
  }, []);

  /* ────────────── data → series, from refs so no effect depends on it ────────────── */

  const applyBars = useCallback((bars: Bar[]) => {
    const price = priceSeriesRef.current;
    const vol = volumeSeriesRef.current;
    if (!price || !vol) return;
    const d = dirRef.current;
    if (priceKindRef.current === 'candles') {
      (price as ISeriesApi<'Candlestick'>).setData(
        bars.map((b) => ({
          close: b.close,
          high: b.high,
          low: b.low,
          open: b.open,
          time: b.time as UTCTimestamp,
        })),
      );
    } else {
      (price as ISeriesApi<'Line'>).setData(
        bars.map((b) => ({ time: b.time as UTCTimestamp, value: b.close })),
      );
    }
    vol.setData(
      bars.map((b) => ({
        color: alpha(b.close >= b.open ? d.up : d.down, 0.22),
        time: b.time as UTCTimestamp,
        value: b.volume,
      })),
    );
    maSeriesRef.current.forEach((series, i) => {
      const cfg = MOVING_AVERAGES[i];
      if (!cfg) return;
      series.setData(
        movingAverage(bars, cfg.period)
          // A traded asset has no zero price; a zero here is a warm-up artefact
          // and would drag the price axis down to it.
          .filter((p) => Number.isFinite(p.value) && p.value > 0)
          .map((p) => ({
            time: p.time as UTCTimestamp,
            value: p.value,
          })),
      );
    });
  }, []);

  const redrawReferenceLines = useCallback((minutes: number) => {
    const series = priceSeriesRef.current;
    const bars = barsRef.current;
    if (!series) return;
    for (const line of priceLinesRef.current) {
      try {
        series.removePriceLine(line);
      } catch {
        /* the series the line belonged to is gone */
      }
    }
    priceLinesRef.current = [];
    const latest = bars[bars.length - 1];
    if (!latest) return;
    const d = dirRef.current;
    const tk = tokens(themeRef.current.palette.mode);
    priceLinesRef.current.push(
      series.createPriceLine({
        axisLabelVisible: true,
        color: latest.close >= latest.open ? d.up : d.down,
        lineStyle: LineStyle.Dashed,
        lineWidth: 1,
        price: latest.close,
        title: '',
      }),
    );
    if (minutes > MAX_MINUTES_FOR_DAY_LINES) return;
    const dayStart = Math.floor(Date.now() / 1000) - 86_400;
    const dayBars = bars.filter((b) => b.time >= dayStart);
    if (dayBars.length < 2) return;
    for (const [title, price] of [
      ['24h high', Math.max(...dayBars.map((b) => b.high))],
      ['24h low', Math.min(...dayBars.map((b) => b.low))],
    ] as const) {
      priceLinesRef.current.push(
        series.createPriceLine({
          axisLabelVisible: false,
          color: tk.text.tertiary,
          lineStyle: LineStyle.Dotted,
          lineWidth: 1,
          price,
          title,
        }),
      );
    }
  }, []);

  const setLegendFrom = useCallback((bar: Bar | undefined) => {
    if (!bar) return;
    setLegend({
      ...bar,
      changePercent: bar.open > 0 ? ((bar.close - bar.open) / bar.open) * 100 : null,
    });
  }, []);

  /* ────────────── 1. the chart: one per pair + timeframe ────────────── */

  useEffect(() => {
    let mounted = true;
    const container = containerRef.current;
    if (!container) return;
    if (!selectedPair) {
      setLoadingState('error');
      setErrorMessage('No trading pairs configured for this network.');
      return;
    }
    setLoadingState('loading');
    setErrorMessage('');
    setLegend(null);

    const chart = createChart(container, chartOptions(resolutionMinutes));
    chartRef.current = chart;
    if (import.meta.env.DEV) {
      // Dev-only handle, so a diagnostic can ask the chart what it actually has
      // rather than infer it from pixels. Stripped from production builds.
      (window as unknown as { __dexChart?: unknown }).__dexChart = {
        bars: () => barsRef.current,
        chart,
        series: () => priceSeriesRef.current,
      };
    }

    priceKindRef.current = chartTypeRef.current;
    const priceSeries = makePriceSeries(chart, chartTypeRef.current);
    priceSeriesRef.current = priceSeries;

    const volume = chart.addSeries(HistogramSeries, {
      lastValueVisible: false,
      priceFormat: { type: 'volume' },
      priceLineVisible: false,
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { bottom: 0, top: 0.88 } });
    volumeSeriesRef.current = volume;
    maSeriesRef.current = showMaRef.current ? makeMaSeries(chart) : [];

    applyChartTheme(chartColors(themeRef.current));
    detachDrawingsRef.current = drawingsRef.current.attach(
      chart,
      priceSeries,
      container,
      resolutionMinutes * 60,
    );

    const onCrosshairMove: Parameters<typeof chart.subscribeCrosshairMove>[0] = (param) => {
      if (!mounted) return;
      const bars = barsRef.current;
      if (bars.length === 0) return;
      const hovered = param.time
        ? bars.find((b) => b.time === (param.time as number))
        : bars[bars.length - 1];
      setLegendFrom(hovered);
    };
    chart.subscribeCrosshairMove(onCrosshairMove);

    const onRangeChange = () => {
      if (!mounted) return;
      const r = chart.timeScale().getVisibleLogicalRange();
      const all = barsRef.current;
      if (!r || all.length === 0) return setClippedHigh(null);
      const win = all.slice(Math.max(0, Math.floor(r.from)), Math.min(all.length, Math.ceil(r.to)));
      const robust = robustRange(win);
      if (!robust || win.length === 0) return setClippedHigh(null);
      const high = Math.max(...win.map((x) => x.high));
      setClippedHigh(high > robust.max ? high : null);
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);

    const symbolInfo = buildSymbolInfo();
    let liveTimer: ReturnType<typeof setInterval> | null = null;

    const teardown = () => {
      mounted = false;
      if (liveTimer) clearInterval(liveTimer);
      detachDrawingsRef.current();
      detachDrawingsRef.current = () => {};
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRangeChange);
      chartRef.current = null;
      priceSeriesRef.current = null;
      volumeSeriesRef.current = null;
      maSeriesRef.current = [];
      priceLinesRef.current = [];
      try {
        chart.remove();
      } catch {
        /* a late RAF after remove */
      }
    };

    if (!symbolInfo) {
      setLoadingState('error');
      setErrorMessage('No trading pairs configured for this network.');
      return teardown;
    }

    const to = Math.floor(Date.now() / 1000);
    const defaultFrom = historyStartSeconds(to, resolutionMinutes);
    // A remembered bar older than the default window means the default window
    // is empty; start where the data was instead.
    const remembered = readLastBar(pairKey, resolution);
    const from =
      remembered && remembered < defaultFrom
        ? historyStartSeconds(remembered + resolutionMinutes * 60, resolutionMinutes)
        : defaultFrom;
    const info = symbolInfo as Parameters<typeof candlesService.getBars>[0];

    const onBars = (bars: Bar[]) => {
      try {
        barsRef.current = bars;
        const newest = bars[bars.length - 1];
        if (newest) writeLastBar(pairKey, resolution, newest.time);
        applyBars(bars);
        redrawReferenceLines(resolutionMinutes);
        setLegendFrom(bars[bars.length - 1]);
        /*
         * Open on the last ninety bars.
         *
         * Measured, not guessed: swept 40→250 bars against this market at two
         * viewport heights, and 80–100 is the peak. Wider drags in older, wilder
         * prices that stretch the axis; narrower leaves too few bars for the
         * robust scale to tell an outlier from the market, and the axis snaps
         * back to the raw range. Ninety gives a median candle of 8.5px on a
         * desktop and 5.1px on a laptop, against 6.2 and 3.8 at 150.
         */
        if (bars.length > 0) {
          chart.timeScale().setVisibleLogicalRange({
            from: Math.max(0, bars.length - OPEN_WINDOW),
            to: bars.length + 4,
          });
        }

        // Linear or log, decided by the window the reader is about to see.
        if (!logChosenRef.current && bars.length > 1) {
          const shown = bars.slice(Math.max(0, bars.length - OPEN_WINDOW));
          // Judge the range the axis will actually use, not the raw one — the
          // outlier the robust scale discards must not also force log on.
          const robust = robustRange(shown);
          const lows = shown.map((x) => x.low).filter((v) => v > 0);
          const highs = shown.map((x) => x.high).filter((v) => v > 0);
          const ratio = robust
            ? robust.max / Math.max(robust.min, 1e-12)
            : lows.length && highs.length
              ? Math.max(...highs) / Math.min(...lows)
              : 1;
          // Three-to-one is where a 1%-range candle drops under two pixels in a
          // 340px price area — the point at which the chart stops reading as
          // candles at all.
          setLogScale(ratio >= 3);
        }
        setLoadingState(bars.length > 0 ? 'success' : 'empty');
        logger.debug('[Chart] Loaded', bars.length, 'bars at', resolution);
        // Keep the newest bar current without ever rebuilding the chart.
        if (bars.length > 0 && !liveTimer) {
          liveTimer = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            candlesService.getBars(
              info,
              resolution,
              {
                firstDataRequest: false,
                from: historyStartSeconds(now, resolutionMinutes),
                to: now,
              },
              (raw) => {
                if (!mounted || !priceSeriesRef.current) return;
                const fresh = toBars(raw);
                if (fresh.length === 0) return;
                barsRef.current = fresh;
                applyBars(fresh);
                setLegendFrom(fresh[fresh.length - 1]);
              },
              () => {},
            );
          }, LIVE_REFRESH_MS);
        }
      } catch (err) {
        logger.error('[Chart] Failed to render candles:', err);
        setLoadingState('error');
        setErrorMessage('Failed to render price data.');
      }
    };

    /*
     * Three windows, each tried only if the one before came back empty:
     *
     *   1. the recent window — every liquid market stops here;
     *   2. a window anchored on the pair's last trade, found with one request
     *      (~0.6s), which is where a thin market's data actually is;
     *   3. two years, as thirteen parallel batches — the shotgun, kept only for
     *      a pair whose last trade the data service cannot name.
     *
     * The old path went straight from 1 to 3 and took eight to twenty seconds
     * on a cold load, every time, for a market with sixty days of candles.
     */
    type Pass = 'recent' | 'anchored' | 'deep';
    const lastTradeSeconds = async (): Promise<number | null> => {
      try {
        const txs = (await getExchangeTxList({
          amountAsset: selectedPair.amountAsset,
          limit: 1,
          priceAsset: selectedPair.priceAsset,
        })) as unknown as Array<{ timestamp?: number | string }>;
        const raw = txs[0]?.timestamp;
        if (raw == null) return null;
        const ms = typeof raw === 'number' ? raw : Date.parse(raw);
        return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
      } catch {
        return null;
      }
    };

    /*
     * Every pass lands in one accumulator. The passes overlap by design — the
     * anchored window runs up to the last trade, which the recent window may
     * already hold — so bars are keyed by time and the union is what is drawn.
     */
    let loaded: Bar[] = [];
    const absorb = (incoming: Bar[]) => {
      const byTime = new Map<number, Bar>();
      for (const b of loaded) byTime.set(b.time as number, b);
      for (const b of incoming) byTime.set(b.time as number, b);
      loaded = [...byTime.values()].sort((a, b) => (a.time as number) - (b.time as number));
    };

    const requestBars = (fromSeconds: number, pass: Pass, toSeconds = to) => {
      candlesService.getBars(
        info,
        resolution,
        { firstDataRequest: true, from: fromSeconds, to: toSeconds },
        (raw) => {
          if (!mounted) return;
          absorb(toBars(raw));
          /*
           * Escalate on "not enough to open on", not on "nothing at all".
           *
           * This used to stop at the first pass that returned any bar. On a
           * second visit the remembered last bar pulls the first window up to
           * the market's final print; that window returns exactly one bar, and
           * one is more than zero — so the 1,117 bars behind it were never
           * asked for. A fresh browser has no remembered bar, gets zero from
           * the default window, and escalated correctly: every automated run
           * passed and every real one did not.
           */
          if (loaded.length >= OPEN_WINDOW || pass === 'deep') {
            onBars(loaded);
            return;
          }
          if (pass === 'recent') {
            void lastTrade.then((t) => {
              if (!mounted) return;
              if (t) {
                logger.debug('[Chart] recent window short; anchoring on last trade');
                // Four batches back from the last trade. A thin market's history sits
                // months before its last trade — three hundred bars back from it held
                // one candle here — and four parallel requests cover ~240 days at 1H.
                const step = resolutionMinutes * 60;
                requestBars(t + step - MAX_RESOLUTION * 4 * step, 'anchored', t + step);
              } else {
                logger.debug('[Chart] no last trade found; widening to deep history');
                requestBars(to - DEEP_HISTORY_SECONDS, 'deep');
              }
            });
            return;
          }
          logger.debug('[Chart] anchored window short; widening to deep history');
          requestBars(to - DEEP_HISTORY_SECONDS, 'deep');
        },
        (err) => {
          if (!mounted) return;
          logger.error('[Chart] getBars error:', err);
          setLoadingState('error');
          setErrorMessage('Failed to load price data from data service.');
        },
      );
    };
    // The lookup runs alongside the recent pass, not after it: on a thin
    // market the recent pass is an empty round-trip, and the second pass
    // should not have to wait for it to learn where to look.
    const lastTrade = lastTradeSeconds();
    requestBars(from, 'recent');

    return teardown;
  }, [
    selectedPair,
    pairKey,
    resolution,
    resolutionMinutes,
    buildSymbolInfo,
    toBars,
    chartOptions,
    makePriceSeries,
    makeMaSeries,
    applyBars,
    redrawReferenceLines,
    setLegendFrom,
  ]);

  /* ────────────── 2. theme: restyle the live chart, no refetch ────────────── */

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions(chartOptions(resolutionMinutes));
    const price = priceSeriesRef.current;
    if (price && priceKindRef.current === 'candles') {
      (price as ISeriesApi<'Candlestick'>).applyOptions({
        downColor: dir.down,
        upColor: dir.up,
        wickDownColor: dir.down,
        wickUpColor: dir.up,
      });
    } else if (price) {
      (price as ISeriesApi<'Line'>).applyOptions({ color: theme.palette.primary.main });
    }
    applyChartTheme(chartColors(theme));
    applyBars(barsRef.current);
    redrawReferenceLines(resolutionMinutes);
  }, [theme, dir, chartOptions, applyBars, redrawReferenceLines, resolutionMinutes]);

  /* ────────────── 3. chart type: swap the series, keep the bars ────────────── */

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    const old = priceSeriesRef.current;
    if (!chart || !container || !old || priceKindRef.current === chartType) return;
    detachDrawingsRef.current();
    for (const line of priceLinesRef.current) {
      try {
        old.removePriceLine(line);
      } catch {
        /* already gone */
      }
    }
    priceLinesRef.current = [];
    chart.removeSeries(old);
    priceKindRef.current = chartType;
    const next = makePriceSeries(chart, chartType);
    priceSeriesRef.current = next;
    applyBars(barsRef.current);
    redrawReferenceLines(resolutionMinutes);
    detachDrawingsRef.current = drawingsRef.current.attach(
      chart,
      next,
      container,
      resolutionMinutes * 60,
    );
  }, [chartType, makePriceSeries, applyBars, redrawReferenceLines, resolutionMinutes]);

  /* ────────────── 4. moving averages: add or remove, from the bars in hand ────────────── */

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const have = maSeriesRef.current.length > 0;
    if (have === showMa) return;
    if (showMa) {
      maSeriesRef.current = makeMaSeries(chart);
      applyBars(barsRef.current);
    } else {
      for (const s of maSeriesRef.current) chart.removeSeries(s);
      maSeriesRef.current = [];
    }
  }, [showMa, makeMaSeries, applyBars]);

  useEffect(() => {
    if (logChosenRef.current) {
      try {
        localStorage.setItem('dex.logScale', logScale ? '1' : '0');
      } catch {
        /* private mode */
      }
    }
    chartRef.current
      ?.priceScale('right')
      .applyOptions({ mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal });
  }, [logScale]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  /* ────────────── render ────────────── */

  const up = legend ? legend.close >= legend.open : true;
  const legendTone = up ? dir.up : dir.down;
  const divider = (
    <Box
      sx={{
        bgcolor: t.border.subtle,
        flexShrink: 0,
        height: 20,
        mx: { xl: 0.5, xs: 0.25 },
        width: '1px',
      }}
    />
  );

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        inset: fullscreen ? 0 : 'auto',
        minHeight: 320,
        position: fullscreen ? 'fixed' : 'relative',
        width: '100%',
        zIndex: fullscreen ? 1300 : 'auto',
      }}
    >
      {/* Toolbar: one fixed row. Nothing wraps, so nothing below it ever moves. */}
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          borderBottom: `1px solid ${t.border.subtle}`,
          flexShrink: 0,
          gap: { xl: 1, xs: 0.75 },
          height: TOOLBAR_H,
          minWidth: 0,
          overflowX: 'auto',
          px: { xl: 1.25, xs: 1 },
          scrollbarWidth: 'none',
        }}
      >
        {leading}
        {leading && divider}
        <Segmented
          ariaLabel="Timeframe"
          onChange={(v: string) => setResolution(v)}
          options={CHART_RESOLUTIONS.map((r) => ({ label: r.label, value: r.value }))}
          value={resolution}
        />
        {divider}
        <Segmented<ChartType>
          ariaLabel="Chart type"
          onChange={setChartType}
          options={[
            {
              label: <CandlestickChart sx={{ fontSize: 16 }} />,
              title: 'Candles',
              value: 'candles',
            },
            { label: <ShowChart sx={{ fontSize: 16 }} />, title: 'Line', value: 'line' },
            { label: <AreaChart sx={{ fontSize: 16 }} />, title: 'Area', value: 'area' },
          ]}
          value={chartType}
        />
        <Tooltip
          enterDelay={600}
          title={logScale ? 'Linear price scale' : 'Logarithmic price scale'}
        >
          <ButtonBase
            aria-pressed={logScale}
            onClick={() => {
              logChosenRef.current = true;
              setLogScale((v) => !v);
            }}
            sx={{
              '&:active': { transform: 'scale(0.97)' },
              [REDUCED]: { transition: 'none' },
              bgcolor: logScale ? t.accent.muted : 'transparent',
              borderRadius: '7px',
              color: logScale ? t.accent.primary : t.text.secondary,
              fontSize: 12,
              fontWeight: 600,
              height: 26,
              px: 1,
              transition: `background-color ${T_FAST}, color ${T_FAST}, transform 100ms ease-out`,
            }}
          >
            LOG
          </ButtonBase>
        </Tooltip>
        <Tooltip title="Moving averages" enterDelay={600}>
          <ButtonBase
            aria-pressed={showMa}
            onClick={() => setShowMa((v) => !v)}
            sx={{
              '&:active': { transform: 'scale(0.97)' },
              [REDUCED]: { transition: 'none' },
              bgcolor: showMa ? t.accent.muted : 'transparent',
              borderRadius: '7px',
              color: showMa ? t.accent.primary : t.text.secondary,
              fontSize: 12,
              fontWeight: 600,
              height: 26,
              px: 1,
              transition: `background-color ${T_FAST}, color ${T_FAST}, transform 100ms ease-out`,
            }}
          >
            MA
          </ButtonBase>
        </Tooltip>
        {divider}
        <DrawingToolbar
          count={drawings.count}
          onClear={drawings.clear}
          onToolChange={drawings.setTool}
          tool={drawings.tool}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'} enterDelay={600}>
          <ButtonBase
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={() => setFullscreen((v) => !v)}
            sx={{
              '&:active': { transform: 'scale(0.95)' },
              '&:hover': { bgcolor: t.surface.hover, color: t.text.primary },
              [REDUCED]: { transition: 'none' },
              borderRadius: '7px',
              color: t.text.secondary,
              height: 28,
              transition: `background-color ${T_FAST}, transform 100ms ease-out`,
              width: 28,
            }}
          >
            {fullscreen ? (
              <CloseFullscreen sx={{ fontSize: 16 }} />
            ) : (
              <OpenInFull sx={{ fontSize: 16 }} />
            )}
          </ButtonBase>
        </Tooltip>
      </Stack>

      {/* The chart area. The legend is reserved height, so it never pushes the canvas. */}
      <Box sx={{ flexGrow: 1, minHeight: 0, position: 'relative', width: '100%' }}>
        <Box ref={containerRef} sx={{ height: '100%', width: '100%' }} />

        <Box
          aria-live="polite"
          data-bars={barsRef.current.length}
          sx={{
            ...NUM,
            alignItems: 'center',
            color: t.text.secondary,
            display: 'flex',
            fontSize: 11.5,
            gap: 1.5,
            height: LEGEND_H,
            left: 12,
            pointerEvents: 'none',
            position: 'absolute',
            top: 8,
            whiteSpace: 'nowrap',
            zIndex: 2,
          }}
        >
          <Box component="span" sx={{ color: t.text.primary, fontWeight: 600 }}>
            {amountName}
            <Box component="span" sx={{ color: t.text.tertiary, fontWeight: 500 }}>
              /{priceName}
            </Box>
          </Box>
          <Box component="span" sx={{ color: t.text.tertiary }}>
            {resolutionLabel}
          </Box>
          {legend && loadingState === 'success' && (
            <>
              {(
                [
                  ['O', legend.open],
                  ['H', legend.high],
                  ['L', legend.low],
                  ['C', legend.close],
                ] as const
              ).map(([k, v]) => (
                <Box component="span" key={k}>
                  <Box component="span" sx={{ color: t.text.tertiary }}>
                    {k}{' '}
                  </Box>
                  <Box component="span" sx={{ color: legendTone }}>
                    {fmt(v)}
                  </Box>
                </Box>
              ))}
              {legend.changePercent !== null && (
                <Box component="span" sx={{ color: legendTone }}>
                  {legend.changePercent >= 0 ? '+' : ''}
                  {legend.changePercent.toFixed(2)}%
                </Box>
              )}
              <Box component="span">
                <Box component="span" sx={{ color: t.text.tertiary }}>
                  V{' '}
                </Box>
                {legend.volume.toLocaleString('en-US')}
              </Box>
            </>
          )}
        </Box>

        {clippedHigh !== null && loadingState === 'success' && (
          <Tooltip
            enterDelay={300}
            title={`A print at ${fmt(clippedHigh)} sits above the scale. The axis follows the body of the market so the candles stay readable; this bar is drawn past the top edge.`}
          >
            <Box
              sx={{
                ...NUM,
                alignItems: 'center',
                bgcolor: t.surface.overlay,
                border: `1px solid ${t.border.subtle}`,
                borderRadius: '7px',
                color: t.text.secondary,
                cursor: 'help',
                display: 'flex',
                fontSize: 10.5,
                gap: 0.5,
                position: 'absolute',
                px: 0.75,
                py: 0.25,
                right: 68,
                top: 8,
                zIndex: 2,
              }}
            >
              <Box component="span" sx={{ color: dir.up }}>
                ▲
              </Box>
              {fmt(clippedHigh)} off scale
            </Box>
          </Tooltip>
        )}

        {loadingState === 'loading' && (
          <LinearProgress
            aria-label="Loading chart"
            sx={{
              '& .MuiLinearProgress-bar': { bgcolor: t.accent.primary },
              bgcolor: 'transparent',
              height: 2,
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          />
        )}
        {(loadingState === 'empty' || loadingState === 'error') && (
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              inset: 0,
              justifyContent: 'center',
              pointerEvents: 'none',
              position: 'absolute',
            }}
          >
            <Box
              sx={{
                bgcolor: t.surface.overlay,
                border: `1px solid ${t.border.subtle}`,
                borderRadius: '12px',
                maxWidth: 380,
                px: 2.5,
                py: 2,
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                {loadingState === 'empty' ? 'No trades yet' : 'Chart unavailable'}
              </Typography>
              <Typography sx={{ color: t.text.secondary, fontSize: 12.5, mt: 0.5 }}>
                {loadingState === 'empty'
                  ? `${amountName}/${priceName} has no trades to draw. The order book is live.`
                  : errorMessage || 'No price history available for this pair.'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
