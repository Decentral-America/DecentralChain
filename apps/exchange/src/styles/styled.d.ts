// Styled components type definitions
import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      // The ink that goes on `primary` — the styled-components counterpart of
      // MUI's `palette.primary.contrastText`, reading the same
      // `accent.onPrimary` token so the two consumers cannot drift. Per mode:
      // white on the light-mode accent, near-black on the dark-mode one, which
      // is why a hardcoded 'white' was wrong here (3.24:1 in dark).
      // See task-2-report.md, Fix rounds 4-5.
      onPrimary: string;
      secondary: string;
      background: string;
      text: string;
      // A foreground-legible sibling to `text`, for de-emphasised text (e.g. a
      // subtitle) — distinct from `secondary`, which is a *background* colour
      // calibrated to keep `text` legible on top of it. Two different jobs;
      // see task-2-report.md, Fix round 2.
      textMuted: string;
      border: string;
      error: string;
      success: string;
      warning: string;
      info?: string;
      disabled?: string;
      hover?: string;
    };
    fonts: {
      main: string;
      mono: string;
    };
    fontSizes: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeights: {
      light: number;
      regular: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    radii: {
      sm: string;
      md: string;
      lg: string;
      full: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    transitions: {
      fast: string;
      medium: string;
      slow: string;
    };
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
      wide: string;
    };
    zIndices: {
      dropdown: number;
      sticky: number;
      fixed: number;
      modal: number;
      popover: number;
      toast: number;
    };
  }
}
