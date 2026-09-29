import { type Theme } from '@mui/material';
import { fonts } from '@/styles/tokens';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The terminal's design constants, kept in one file so a number is never
 * invented twice. Every colour here is a *role* read off the semantic token set;
 * nothing names a hex.
 */

/** Tabular numerals in the house mono stack: every price and size lines up. */
export const MONO = fonts.mono;
export const NUM: React.CSSProperties = {
  fontFamily: MONO,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: 0,
};

/** Chrome heights. Fixed so nothing below them ever shifts. */
export const TOOLBAR_H = 44;
export const TABS_H = 40;
export const RIGHT_COL_W = 340;
export const BOTTOM_H = 260;

/**
 * Motion. Expo-out is critically damped in feel — it settles without a bounce,
 * which is what Apple ships for anything that was not thrown. Nothing in this
 * terminal is dragged, so CSS carries it; a spring library would be 30 kB for a
 * segmented control.
 */
export const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const T_FAST = `120ms ${EASE}`;
export const T_BASE = `200ms ${EASE}`;
export const REDUCED = '@media (prefers-reduced-motion: reduce)';

/**
 * Market direction colours.
 *
 * Blue for up, violet for down — both from the brand's own `appTile` hues, so
 * the chart reads as this product rather than as every other exchange. Green
 * and red are deliberately not used: they are `intent.success`/`danger`, which
 * this app reserves for UI states. An order that *failed* is red; a price that
 * *fell* is not an error, and colouring it that way spends the alarm colour on
 * something that happens half the time.
 *
 * The two sit either side of `accent.primary` in hue, far enough apart to tell
 * at a glance and from each other under deuteranopia — which the green/red pair
 * they replace is not.
 */
export function direction(theme: Theme) {
  const t = tokens(theme.palette.mode);
  return {
    down: t.appTile.violet.fill,
    onDown: t.appTile.violet.on,
    onUp: t.appTile.blue.on,
    up: t.appTile.blue.fill,
  };
}

/** Hex + alpha, for the translucent fills a canvas needs as strings. */
export const alpha = (hex: string, a: number) =>
  `${hex}${Math.round(Math.min(Math.max(a, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0')}`;
