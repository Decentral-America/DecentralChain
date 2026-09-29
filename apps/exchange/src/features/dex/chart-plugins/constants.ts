// ── Trading Page Constants ────────────────────────────────────────────────────

import { type Theme } from '@mui/material';
import { direction } from '../terminal/terminalTokens';

export const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

/**
 * Master switch for session replay (HUD + scrubber). Disabled on the live
 * terminal until the feature is fully QA'd — flip to `true` to re-enable the
 * replay controls everywhere they mount.
 */
export const REPLAY_ENABLED = false;

/**
 * The chart palette, derived from the app's theme rather than declared here.
 *
 * OpenCharts shipped this as a literal table of 42 colours — a second design
 * system, which is exactly what `theme/__tests__/noRawColours.test.ts` exists to
 * keep out. Canvas cannot read a token, so the colours still have to arrive as
 * strings; the difference is that they arrive resolved from `theme.palette`
 * instead of being invented here. One source, and the chart follows the app into
 * dark mode without a second table to keep in step.
 *
 * Direction colours are `success`/`error` because that is what the rest of this
 * app already uses for up and down, including `TradingViewChart` itself.
 */

export interface ChartColors {
  askLabelBg: string;
  askLine: string;
  background: string;
  bidLabelBg: string;
  bidLine: string;
  crosshair: string;
  down: string;
  grid: string;
  lastPriceDown: string;
  lastPriceUp: string;
  orderLine: string;
  positionLong: string;
  positionShort: string;
  slLine: string;
  text: string;
  tpLine: string;
  up: string;
  volumeDown: string;
  volumeUp: string;
  watermark: string;
}

export function chartColors(theme: Theme): ChartColors {
  // The same two hues the candles use, so a drawing's chrome and the series it
  // sits on cannot disagree about which way is up.
  const { down, up } = direction(theme);
  const dark = theme.palette.mode === 'dark';
  return {
    askLabelBg: down,
    askLine: down,
    background: theme.palette.background.paper,
    bidLabelBg: up,
    bidLine: up,
    crosshair: theme.palette.text.disabled,
    down,
    grid: theme.palette.divider,
    lastPriceDown: down,
    lastPriceUp: up,
    orderLine: theme.palette.warning.main,
    positionLong: up,
    positionShort: down,
    slLine: down,
    text: theme.palette.text.secondary,
    tpLine: up,
    up,
    // Volume sits behind the candles, so it is the direction colour at the
    // opacity the existing chart already uses for its own translucent fills.
    volumeDown: `${down}2e`,
    volumeUp: `${up}2e`,
    watermark: dark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
  };
}

/**
 * Per-user color overrides (Chart Settings → Colors). Empty string = use the
 * theme default. Keys map 1:1 onto `ChartColors` fields via COLOR_OVERRIDE_MAP.
 */
export interface ChartColorOverrides {
  colorBackground: string;
  colorGrid: string;
  colorScaleText: string;
  colorCrosshair: string;
  colorBidLine: string;
  colorAskLine: string;
  colorPositionLong: string;
  colorPositionShort: string;
  colorOrderLine: string;
  colorTpLine: string;
  colorSlLine: string;
  /** Candle body colors (also drive wicks/borders unless overridden). */
  candleUpColor: string;
  candleDownColor: string;
}

const COLOR_OVERRIDE_MAP: ReadonlyArray<[keyof ChartColorOverrides, keyof ChartColors]> = [
  ['colorBackground', 'background'],
  ['colorGrid', 'grid'],
  ['colorScaleText', 'text'],
  ['colorCrosshair', 'crosshair'],
  ['colorBidLine', 'bidLine'],
  ['colorAskLine', 'askLine'],
  ['colorPositionLong', 'positionLong'],
  ['colorPositionShort', 'positionShort'],
  ['colorOrderLine', 'orderLine'],
  ['colorTpLine', 'tpLine'],
  ['colorSlLine', 'slLine'],
  ['candleUpColor', 'up'],
  ['candleDownColor', 'down'],
];

/** Theme colors with the user's non-empty overrides applied on top. */
export function mergeChartColors(theme: ChartColors, overrides: ChartColorOverrides): ChartColors {
  const merged = { ...theme };
  for (const [overrideKey, themeKey] of COLOR_OVERRIDE_MAP) {
    const value = overrides[overrideKey];
    if (value) merged[themeKey] = value;
  }
  return merged;
}

/**
 * Armable tools. Some are placement-only aliases that commit a different stored
 * `type`: "ray"/"extended" store a "trendline" with extend flags;
 * "long-position"/"short-position" store a "position" with `side`; "measure" is
 * a transient gesture that never commits.
 */
export type DrawingTool =
  | 'none'
  | 'trendline'
  | 'horizontal'
  | 'fibonacci'
  | 'rectangle'
  | 'vertical'
  | 'ray'
  | 'extended'
  | 'channel'
  | 'text'
  | 'fibextension'
  | 'ellipse'
  | 'arrow'
  | 'triangle'
  | 'position'
  | 'long-position'
  | 'short-position'
  | 'measure';

/** Stored drawing kinds (excludes placement-only aliases). */
export type DrawingType = Exclude<
  DrawingTool,
  'none' | 'ray' | 'extended' | 'long-position' | 'short-position' | 'measure'
>;

export type DrawingLineStyle = 'solid' | 'dashed' | 'dotted';

/** Magnet snapping mode: off, weak (snap within a few px), or strong (always). */
export type MagnetMode = 'none' | 'weak' | 'strong';

export interface DrawingLine {
  id: string;
  type: DrawingType;
  price: number;
  price2?: number | undefined;
  time?: number | undefined;
  time2?: number | undefined;
  /** Third anchor — parallel-channel offset line. */
  price3?: number | undefined;
  time3?: number | undefined;
  color: string;
  // v2 style/behavior fields — all optional so v1 drawings load unchanged
  /** Line width in px (default 2). */
  width?: number | undefined;
  lineStyle?: DrawingLineStyle | undefined;
  /** Locked drawings can be selected but not moved or resized. */
  locked?: boolean | undefined;
  /** Trendline only: extend the line to the pane edges. */
  extendLeft?: boolean | undefined;
  extendRight?: boolean | undefined;
  /** Hidden drawings stay in the object tree but don't render or hit-test. */
  hidden?: boolean | undefined;
  /** Render order — higher draws on top. Defaults to creation order. */
  zIndex?: number | undefined;
  /** Timeframe the drawing was created on (used by visibility "tf"). */
  createdTf?: string | undefined;
  /** "all" (default) shows on every timeframe; "tf" only on createdTf. */
  visibility?: 'all' | 'tf';
  // ── Styling depth (Tier 4) ──
  /** Fill colour for shapes / channel / fib bands (defaults to `color`). */
  fillColor?: string | undefined;
  /** Fill opacity 0–1 (defaults per drawing kind). */
  fillOpacity?: number | undefined;
  /** Arrowheads on line ends (trendline / arrow). */
  arrowStart?: boolean | undefined;
  arrowEnd?: boolean | undefined;
  /** Text content + size for text/callout drawings and attachable labels. */
  text?: string | undefined;
  fontSize?: number | undefined;
  /** Bold / italic styling for text drawings. */
  bold?: boolean | undefined;
  italic?: boolean | undefined;
  /** Optional text-box background (text drawings). */
  textBg?: boolean | undefined;
  textBgColor?: string | undefined;
  /** Optional text-box border (text drawings). */
  textBorder?: boolean | undefined;
  textBorderColor?: string | undefined;
  /** Custom fibonacci levels (fractions); defaults applied when absent. */
  fibLevels?: number[] | undefined;
  // ── Position tool (long/short risk-reward) ──
  side?: 'long' | 'short';
  /** Stop-loss price (position tool). */
  stopPrice?: number | undefined;
  /** Take-profit price (position tool). */
  targetPrice?: number | undefined;
  /** % of account equity risked — drives size/$ readout (default 1). */
  riskPct?: number | undefined;
  // ── Price alerts on lines ──
  /** When set, the platform alerts when price crosses this line. */
  alertEnabled?: boolean | undefined;
  alertMessage?: string | undefined;
}

/** Swatch palette for the floating drawing toolbar (TradingView-style). */
export const DRAWING_COLORS = [
  '#2196F3',
  '#f0b90b',
  '#0ecb81',
  '#f6465d',
  '#9c27b0',
  '#ff9800',
  '#787b86',
  '#ffffff',
] as const;

export const DRAWING_WIDTHS = [1, 2, 3, 4] as const;

/** Timeframe interval in milliseconds */
export const TF_INTERVAL_MS: Record<Timeframe, number> = {
  '1d': 24 * 60 * 60_000,
  '1h': 60 * 60_000,
  '1m': 60_000,
  '1w': 7 * 24 * 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '30m': 30 * 60_000,
};

export const KNOWN_CURRENCIES = [
  'EUR',
  'USD',
  'GBP',
  'JPY',
  'AUD',
  'NZD',
  'CAD',
  'CHF',
  'CNY',
  'HKD',
  'SGD',
  'SEK',
  'NOK',
  'MXN',
  'ZAR',
  'TRY',
  'PLN',
  'CZK',
  'HUF',
  'DKK',
];

export interface NewsOverlayConfig {
  enabled: boolean;
  lineColor: string;
  showPast: boolean;
  showFuture: boolean;
  showHigh: boolean;
  showMedium: boolean;
  showLow: boolean;
}

export interface EconomicEvent {
  time: string;
  currency: string;
  impact: 'low' | 'medium' | 'high';
  event: string;
  forecast?: string;
  previous?: string;
  actual?: string;
}

export interface NewsItem {
  time: string;
  title: string;
  source: string;
  impact: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Canvas chrome for the drawing layer.
 *
 * A canvas cannot read a design token, so these have to be strings by the time a
 * renderer reaches them. Rather than thread a palette through twenty renderer
 * signatures, the React layer resolves the theme once and writes it here — the
 * same direction of travel the rest of the app uses (`TradingViewChart` already
 * resolves the direction hues and hands the values to the chart), just
 * with one hop instead of twenty.
 *
 * The defaults are only what renders before `applyChartTheme` runs on mount.
 */
export const chartChrome = {
  alertFill: '#f0b90b',
  alertStroke: '#1b1f2a',
  entryLine: '#d1d4dc',
  handleFill: '#ffffff',
  labelBg: '#1e222d',
  positionLong: '#089981',
  positionShort: '#f23645',
  previewLine: '#b2b5be',
  tooltipBg: 'rgba(20, 24, 35, 0.92)',
  tooltipText: '#e0e3ea',
};

/** Points the drawing chrome at the app's theme. Called once on chart mount. */
export function applyChartTheme(c: ChartColors): void {
  chartChrome.entryLine = c.crosshair;
  chartChrome.handleFill = c.background;
  chartChrome.labelBg = c.grid;
  chartChrome.positionLong = c.positionLong;
  chartChrome.positionShort = c.positionShort;
  chartChrome.previewLine = c.text;
  chartChrome.tooltipBg = c.background;
  chartChrome.tooltipText = c.text;
  chartChrome.alertFill = c.orderLine;
  chartChrome.alertStroke = c.grid;
}

/**
 * Fibonacci level colours.
 *
 * A ramp the reader is meant to tell apart at a glance, not app chrome: seven
 * distinguishable hues carry meaning here in the way a categorical chart palette
 * does. Lives beside `DRAWING_COLORS` so every user-facing colour this feature
 * offers sits in one file.
 */
export const FIB_COLORS = [
  '#e91e63',
  '#ff5722',
  '#ff9800',
  '#ffc107',
  '#4caf50',
  '#2196F3',
  '#9c27b0',
] as const;
