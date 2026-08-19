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
  accent: { primary: string; muted: string; onPrimary: string };
  intent: { success: string; danger: string; warning: string; info: string };
}

export const SEMANTIC_TOKENS: Record<ThemeMode, SemanticTokens> = {
  dark: {
    // Dark `accent.primary` is a *light* violet, so its ink is near-black:
    // 5.63:1, where white would be 3.24:1.
    accent: { muted: '#3d2f8f', onPrimary: '#14122b', primary: '#8b7dff' },
    border: { strong: '#3a3358', subtle: '#241d42' },
    intent: { danger: '#ff6b6b', info: '#6aa8ff', success: '#3ddc97', warning: '#ffb84d' },
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
    accent: { muted: '#e8e6ff', onPrimary: '#ffffff', primary: '#5b4bdb' },
    border: { strong: '#c7c3e0', subtle: '#e9e7f2' },
    intent: { danger: '#c62828', info: '#1565c0', success: '#1b7a4b', warning: '#a15c00' },
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

/** Relative luminance per WCAG 2.1. */
function luminance(hex: string): number {
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
