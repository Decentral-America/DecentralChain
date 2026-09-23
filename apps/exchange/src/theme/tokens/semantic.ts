/**
 * Semantic design tokens — the single source of truth for colour.
 *
 * Components never name a colour, only a role: `surface.raised`, `text.secondary`.
 * That indirection is what makes dark mode a value swap instead of a rewrite, and
 * it is what the codebase previously lacked — `palette.indigoHover` and
 * `brandInk.night` are literals with no counterpart in the other mode.
 *
 * Both the MUI theme and the styled-components theme are derived from this file,
 * so the two cannot drift apart.
 */

export type ThemeMode = 'light' | 'dark';

/**
 * The tile hues the launcher identifies features by.
 *
 * A fixed set of roles, not a per-feature lookup: a sixteenth destination
 * reuses a hue rather than inventing one. Eight is the number that stays
 * mutually distinguishable *and* clears AA in both modes — fifteen distinct
 * hues cannot do both, some pairs always collapse into each other.
 *
 * Declared as a `const` array so the runtime list and the union type come from
 * one place; a test walks it to assert the floors per hue.
 */
export const APP_TILE_HUES = [
  'amber',
  'blue',
  'green',
  'indigo',
  'rose',
  'slate',
  'teal',
  'violet',
] as const;

export type AppTileHue = (typeof APP_TILE_HUES)[number];

export interface SemanticTokens {
  surface: { base: string; hover: string; overlay: string; raised: string; sunken: string };
  border: { subtle: string; strong: string };
  text: { primary: string; secondary: string; tertiary: string };
  /**
   * `onPrimary` is the ink that goes *on* `accent.primary` — a role of its own,
   * defined per mode like every other token here. `accent.primary` sits at a
   * medium luminance in both modes, so no single ink clears AA against both
   * (white: 6.04 light / 3.24 dark; black: 3.47 light / 6.48 dark). It does not
   * need to: a mode's ink only ever meets that mode's accent.
   */
  /**
   * `primaryHover` is the pressed/hover shade of `accent.primary`. It exists as
   * a token because MUI otherwise derives `primary.dark` by darkening `main`
   * blindly: in dark mode that walks the surface *away* from `onPrimary`'s
   * near-black ink (3.05:1 on the auto-derived shade). Defined here, the hover
   * shade stays inside the band where the ink still clears AA.
   */
  accent: { primary: string; muted: string; onPrimary: string; primaryHover: string };
  /**
   * Feature-identifying tile fills, each with the ink that survives on it.
   *
   * Same contract as `intent`: the fill inverts between modes — a deep shade
   * in light, a light tint in dark — so the ink inverts with it, white on
   * light-mode fills and near-black on dark-mode ones. All sixteen pairs clear
   * 4.5:1, stricter than the 3:1 WCAG 1.4.11 asks of a graphic, because that
   * is the floor the rest of this file holds.
   */
  appTile: Record<AppTileHue, { fill: string; on: string }>;
  /**
   * `on*` is the ink that goes *on* the matching intent fill — the same
   * per-mode role as `accent.onPrimary`. Every intent fill is a light tint in
   * dark mode and a deep shade in light mode, so the ink inverts between them:
   * white on light-mode fills, near-black on dark-mode fills. Ratios are in
   * the plan's Task 10 table; all eight clear 4.5:1.
   */
  intent: {
    success: string;
    danger: string;
    warning: string;
    info: string;
    onSuccess: string;
    onDanger: string;
    onWarning: string;
    onInfo: string;
  };
}

export const SEMANTIC_TOKENS: Record<ThemeMode, SemanticTokens> = {
  dark: {
    // Dark `accent.primary` is a *light* violet, so its ink is near-black:
    // 5.63:1, where white would be 3.24:1.
    accent: {
      muted: '#3d2f8f',
      onPrimary: '#14122b',
      primary: '#8b7dff',
      primaryHover: '#7d70eb',
    },
    appTile: {
      amber: { fill: '#fcd34d', on: '#14122b' },
      blue: { fill: '#7dd3fc', on: '#14122b' },
      green: { fill: '#4ade80', on: '#14122b' },
      // Same value as `accent.primary`: the house colour staying on Dashboard
      // is what keeps the launcher looking like this product. If the brand
      // accent moves, this moves with it — deliberately, but consciously.
      indigo: { fill: '#8b7dff', on: '#14122b' },
      rose: { fill: '#fda4af', on: '#14122b' },
      slate: { fill: '#a8b3c4', on: '#14122b' },
      teal: { fill: '#5eead4', on: '#14122b' },
      violet: { fill: '#c4b5fd', on: '#14122b' },
    },
    border: { strong: '#3a3358', subtle: '#241d42' },
    intent: {
      danger: '#ff6b6b',
      info: '#6aa8ff',
      onDanger: '#14122b',
      onInfo: '#14122b',
      onSuccess: '#14122b',
      onWarning: '#14122b',
      success: '#3ddc97',
      warning: '#ffb84d',
    },
    surface: {
      base: '#0b0724',
      hover: '#201b3b',
      overlay: '#151033',
      raised: '#141029',
      sunken: '#080519',
    },
    text: { primary: '#f5f4ff', secondary: '#b8b3d9', tertiary: '#8a85ab' },
  },
  light: {
    // Light `accent.primary` is a deep violet, so its ink is white: 6.04:1.
    accent: {
      muted: '#e8e6ff',
      onPrimary: '#ffffff',
      primary: '#5b4bdb',
      primaryHover: '#4a3bb8',
    },
    appTile: {
      amber: { fill: '#b45309', on: '#ffffff' },
      blue: { fill: '#1d4ed8', on: '#ffffff' },
      green: { fill: '#15803d', on: '#ffffff' },
      // See the dark-mode note: same value as `accent.primary`, on purpose.
      indigo: { fill: '#5b4bdb', on: '#ffffff' },
      rose: { fill: '#be123c', on: '#ffffff' },
      slate: { fill: '#475569', on: '#ffffff' },
      teal: { fill: '#0f766e', on: '#ffffff' },
      violet: { fill: '#7c3aed', on: '#ffffff' },
    },
    border: { strong: '#c7c3e0', subtle: '#e9e7f2' },
    intent: {
      danger: '#c62828',
      info: '#1565c0',
      onDanger: '#ffffff',
      onInfo: '#ffffff',
      onSuccess: '#ffffff',
      onWarning: '#ffffff',
      success: '#1b7a4b',
      warning: '#a15c00',
    },
    surface: {
      base: '#f7f7fb',
      hover: '#e6e5f2',
      overlay: '#ffffff',
      raised: '#ffffff',
      sunken: '#eeedf5',
    },
    text: { primary: '#14122b', secondary: '#4a4668', tertiary: '#6b6788' },
  },
};

/** Tokens for a mode. */
export function tokens(mode: ThemeMode): SemanticTokens {
  return SEMANTIC_TOKENS[mode];
}

const HEX_COLOUR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Relative luminance per WCAG 2.1. */
function luminance(hex: string): number {
  if (!HEX_COLOUR.test(hex)) {
    // Documented hex-only (see `contrastRatio`'s docstring). Before this
    // guard, a non-hex string (e.g. `rgb()`/`rgba()`) fell through to
    // `Number.parseInt` on the wrong slice and returned `NaN`, which happens
    // to fail every `toBeGreaterThanOrEqual` comparison today — but silently,
    // and only by accident. Failing loudly here means a future caller finds
    // out at the call site, not by staring at an unexplained `NaN`.
    throw new Error(
      `contrastRatio expects an opaque 3- or 6-digit hex colour (e.g. "#fff" or "#ffffff"); got ${JSON.stringify(hex)}. Translucent or rgb()/rgba() values are not supported — composite them to an opaque hex first.`,
    );
  }
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const channels = [0, 2, 4].map((i) => {
    const v = Number.parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = channels as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two opaque hex colours.
 *
 * Opaque only — every token in this file is a solid hex precisely so contrast
 * can be checked. Translucent values belong in the overlay treatments, not here.
 */
export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
