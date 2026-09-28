// Styled components type definitions — mirrors the shape built in ./themes
import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    /** 'light' | 'dark' — lets components branch without reading context */
    mode: 'light' | 'dark';
    /**
     * Every colour is read from the semantic tokens (src/theme/tokens/semantic.ts)
     * or, for the few translucent materials, from `chrome` in src/styles/tokens.ts.
     */
    colors: {
      /** Indigo action color — buttons, links, icon strokes. Never body text. */
      primary: string;
      /** Hover/active state for the accent */
      primaryHover: string;
      /** Softest violet surface — tinted cards and pills */
      primarySurface: string;
      /** Hairline outline-button border */
      primaryBorder: string;
      // The ink that goes on `primary` — the styled-components counterpart of
      // MUI's `palette.primary.contrastText`, reading the same
      // `accent.onPrimary` token so the two consumers cannot drift. Per mode:
      // white on the light-mode accent, black on the dark-mode one, which is
      // why a hardcoded 'white' was wrong here (3.71:1 in dark).
      // See task-2-report.md, Fix rounds 4-5.
      onPrimary: string;
      /** Same ink as `onPrimary`, under the name the redesigned screens use */
      textOnPrimary: string;
      // A *background* colour, calibrated to keep `text` legible on top of it.
      // Not a text colour: for de-emphasised text use `textSecondary` or
      // `textMuted`. See task-2-report.md, Fix round 2.
      secondary: string;
      /** Page canvas */
      background: string;
      /** Quiet section band */
      backgroundAlt: string;
      /** Card / elevated surface */
      surface: string;
      /** Hover background for rows and controls */
      surfaceHover: string;
      /** Primary heading and body text */
      text: string;
      /** Labels and captions */
      textSecondary: string;
      // A foreground-legible sibling to `text`, for de-emphasised text (e.g. a
      // subtitle) — distinct from `secondary`, which is a *background* colour
      // calibrated to keep `text` legible on top of it. Two different jobs;
      // see task-2-report.md, Fix round 2.
      textMuted: string;
      /** Least-emphasis text that is still read (placeholders, helper copy) */
      textSubtle: string;
      /** Default hairline border and divider */
      border: string;
      /** Emphasized border */
      borderStrong: string;
      disabled: string;
      error: string;
      errorSurface: string;
      success: string;
      successSurface: string;
      warning: string;
      warningSurface: string;
      info: string;
      infoSurface: string;
      /** Order-book / trade side colors */
      buy: string;
      sell: string;
      /** Text on a filled buy / sell surface, at least 4.5:1 in each mode */
      onBuy: string;
      onSell: string;
      hover: string;
      // The ink that goes on the matching intent fill — the styled-components
      // counterpart of MUI's `palette.<intent>.contrastText`, reading the
      // same `intent.on*` token so the two consumers cannot drift. Per mode:
      // white on light-mode fills, black on dark-mode fills. See
      // task-10-report.md.
      onError: string;
      onSuccess: string;
      onWarning: string;
      onInfo: string;
    };
    fonts: {
      main: string;
      mono: string;
    };
    /** OpenType feature string — tabular numerals for all figures */
    fontFeatures: string;
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
    /** Full type-scale entries including line height and tracking */
    typography: {
      caption: TypeSpec;
      bodySm: TypeSpec;
      body: TypeSpec;
      bodyLg: TypeSpec;
      subheading: TypeSpec;
      headingSm: TypeSpec;
      heading: TypeSpec;
      headingLg: TypeSpec;
      display: TypeSpec;
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
      xxxl: string;
    };
    radii: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      full: string;
    };
    /** Soft lift in light mode; `none` in dark, where surfaces separate by hairline */
    shadows: {
      none: string;
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
    /** Pixel-valued breakpoints, already suffixed with `px` for media queries */
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
      wide: string;
    };
    layout: {
      pageMaxWidth: string;
      sectionGap: string;
      cardPadding: string;
      elementGap: string;
      gutter: string;
      headerHeight: string;
      sidebarWidth: string;
      minTapTarget: string;
    };
    focusRing: {
      color: string;
      width: string;
      offset: string;
    };
    zIndices: {
      dropdown: number;
      sticky: number;
      fixed: number;
      modal: number;
      popover: number;
      toast: number;
      tooltip: number;
    };
  }

  interface TypeSpec {
    fontSize: string;
    lineHeight: number;
    letterSpacing: string;
    fontWeight: number;
  }
}
