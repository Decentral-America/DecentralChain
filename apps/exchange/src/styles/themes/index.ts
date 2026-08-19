/**
 * Theme definitions for light and dark modes
 * Colour values are derived from the semantic tokens (src/theme/tokens/semantic.ts);
 * everything else (spacing, fonts, radii, ...) is not yet token-driven.
 */
import { type DefaultTheme } from 'styled-components';
import { tokens } from '@/theme/tokens/semantic';

const lightTokens = tokens('light');
const darkTokens = tokens('dark');

export const lightTheme: DefaultTheme = {
  breakpoints: {
    desktop: '1280px',
    mobile: '768px',
    tablet: '1024px',
    wide: '1536px',
  },
  colors: {
    background: lightTokens.surface.base,
    border: lightTokens.border.subtle,
    disabled: lightTokens.text.tertiary,
    error: lightTokens.intent.danger,
    hover: lightTokens.surface.hover,
    info: lightTokens.intent.info,
    // Same token MUI's `primary.contrastText` reads — one ink, two consumers.
    onPrimary: lightTokens.accent.onPrimary,
    primary: lightTokens.accent.primary,
    // Background role: calibrated so `colors.text` stays legible on top of it
    // (the ~10 `background:` consumers). See task-2-report.md, Fix round 2.
    secondary: lightTokens.accent.muted,
    success: lightTokens.intent.success,
    text: lightTokens.text.primary,
    // Foreground role: the sibling `colors.secondary` can't also be — see
    // the doc comment on `DefaultTheme.colors.textMuted` in styled.d.ts.
    textMuted: lightTokens.text.secondary,
    warning: lightTokens.intent.warning,
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
    sm: '4px',
  },
  shadows: {
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    lg: '1.5rem',
    md: '1rem',
    sm: '0.5rem',
    xl: '2rem',
    xs: '0.25rem',
    xxl: '3rem',
  },
  transitions: {
    fast: 'all 0.15s ease',
    medium: 'all 0.3s ease',
    slow: 'all 0.5s ease',
  },
  zIndices: {
    dropdown: 1000,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    sticky: 1100,
    toast: 1500,
  },
};

export const darkTheme: DefaultTheme = {
  breakpoints: {
    desktop: '1280px',
    mobile: '768px',
    tablet: '1024px',
    wide: '1536px',
  },
  colors: {
    background: darkTokens.surface.base,
    border: darkTokens.border.subtle,
    disabled: darkTokens.text.tertiary,
    error: darkTokens.intent.danger,
    hover: darkTokens.surface.hover,
    info: darkTokens.intent.info,
    onPrimary: darkTokens.accent.onPrimary,
    primary: darkTokens.accent.primary,
    secondary: darkTokens.accent.muted,
    success: darkTokens.intent.success,
    text: darkTokens.text.primary,
    textMuted: darkTokens.text.secondary,
    warning: darkTokens.intent.warning,
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
    sm: '4px',
  },
  shadows: {
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
  },
  spacing: {
    lg: '1.5rem',
    md: '1rem',
    sm: '0.5rem',
    xl: '2rem',
    xs: '0.25rem',
    xxl: '3rem',
  },
  transitions: {
    fast: 'all 0.15s ease',
    medium: 'all 0.3s ease',
    slow: 'all 0.5s ease',
  },
  zIndices: {
    dropdown: 1000,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    sticky: 1100,
    toast: 1500,
  },
};
