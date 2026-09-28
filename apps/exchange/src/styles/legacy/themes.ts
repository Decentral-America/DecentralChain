// FROZEN SNAPSHOT of the pre-redesign styled-components themes (monorepo @ d9ef9b63c),
// served only to onboarding through LegacyOnboardingTheme. Do not extend or reuse.
/**
 * Colour is the pre-redesign mapping, read from the frozen semantic tokens.
 * `DefaultTheme` grew with the redesign; the groups and colour keys that did
 * not exist before it (`typography`, `layout`, `focusRing`, `surface`, ...)
 * are filled from the frozen tokens too, or from the current theme where there
 * was no earlier equivalent. The onboarding code this serves predates them.
 */
import { type DefaultTheme } from 'styled-components';
import { darkTheme as currentDark, lightTheme as currentLight } from '@/styles/themes';
import { type ThemeMode, tokens } from './semantic';
import { darkShadows, shadows } from './tokens';

function colorsFor(mode: ThemeMode): DefaultTheme['colors'] {
  const t = tokens(mode);
  return {
    background: t.surface.base,
    backgroundAlt: t.surface.sunken,
    border: t.border.subtle,
    borderStrong: t.border.strong,
    buy: t.intent.success,
    disabled: t.text.tertiary,
    error: t.intent.danger,
    errorSurface: t.surface.sunken,
    hover: t.surface.hover,
    info: t.intent.info,
    infoSurface: t.accent.muted,
    onBuy: t.intent.onSuccess,
    onError: t.intent.onDanger,
    onInfo: t.intent.onInfo,
    onPrimary: t.accent.onPrimary,
    onSell: t.intent.onDanger,
    onSuccess: t.intent.onSuccess,
    onWarning: t.intent.onWarning,
    primary: t.accent.primary,
    primaryBorder: t.border.strong,
    primaryHover: t.accent.primaryHover,
    primarySurface: t.accent.muted,
    secondary: t.accent.muted,
    sell: t.intent.danger,
    success: t.intent.success,
    successSurface: t.surface.sunken,
    surface: t.surface.raised,
    surfaceHover: t.surface.hover,
    text: t.text.primary,
    textMuted: t.text.secondary,
    textOnPrimary: t.accent.onPrimary,
    textSecondary: t.text.secondary,
    textSubtle: t.text.tertiary,
    warning: t.intent.warning,
    warningSurface: t.surface.sunken,
  };
}

const frozen = {
  breakpoints: {
    desktop: '1280px',
    mobile: '768px',
    tablet: '1024px',
    wide: '1536px',
  },
  fontSizes: {
    lg: '1.125rem',
    md: '1rem',
    sm: '0.875rem',
    xl: '1.25rem',
    xs: '0.75rem',
    xxl: '1.5rem',
  },
  fonts: {
    main: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
  },
  fontWeights: {
    bold: 700,
    light: 300,
    medium: 500,
    regular: 400,
    semibold: 600,
  },
  radii: {
    full: '9999px',
    lg: '12px',
    md: '8px',
    none: '0',
    sm: '4px',
  },
  spacing: {
    lg: '1.5rem',
    md: '1rem',
    sm: '0.5rem',
    xl: '2rem',
    xs: '0.25rem',
    xxl: '3rem',
    xxxl: '4rem',
  },
  transitions: {
    fast: 'all 0.15s ease',
    medium: 'all 0.3s ease',
    slow: 'all 0.5s ease',
  },
};

export const lightTheme: DefaultTheme = {
  ...currentLight,
  ...frozen,
  colors: colorsFor('light'),
  mode: 'light',
  shadows: { ...shadows, none: 'none' },
};

export const darkTheme: DefaultTheme = {
  ...currentDark,
  ...frozen,
  colors: colorsFor('dark'),
  mode: 'dark',
  shadows: { ...darkShadows, none: 'none' },
};
