/**
 * styled-components themes.
 *
 * Colour values are derived from the semantic tokens (src/theme/tokens/semantic.ts),
 * the same source the MUI theme reads, so the two layers cannot drift apart. The
 * few translucent materials come from `chrome` in src/styles/tokens.ts, as does
 * everything that does not change between modes (type, rhythm, geometry).
 */
import { type DefaultTheme } from 'styled-components';
import {
  breakpoints,
  chrome,
  darkShadows,
  focusRing,
  fontFeatures,
  fonts,
  fontWeights,
  layout,
  radii,
  shadows,
  spacing,
  transitions,
  typeScale,
  zIndex,
} from '@/styles/tokens';
import { type ThemeMode, tokens } from '@/theme/tokens/semantic';

/** Converts a token type-scale entry into CSS-ready values. */
const spec = (key: keyof typeof typeScale) => ({
  fontSize: `${typeScale[key].size}px`,
  fontWeight: typeScale[key].weight,
  letterSpacing: typeScale[key].tracking,
  lineHeight: typeScale[key].lineHeight,
});

const typography = {
  body: spec('body'),
  bodyLg: spec('bodyLg'),
  bodySm: spec('bodySm'),
  caption: spec('caption'),
  display: spec('display'),
  heading: spec('heading'),
  headingLg: spec('headingLg'),
  headingSm: spec('headingSm'),
  subheading: spec('subheading'),
};

/**
 * Everything that does not change between modes: type, rhythm, geometry.
 * Only color and elevation are mode-specific.
 */
const shared = {
  breakpoints: {
    desktop: `${breakpoints.desktop}px`,
    mobile: `${breakpoints.mobile}px`,
    tablet: `${breakpoints.tablet}px`,
    wide: `${breakpoints.wide}px`,
  },
  fontFeatures,
  fontSizes: {
    lg: `${typeScale.bodyLg.size}px`,
    md: `${typeScale.body.size}px`,
    sm: `${typeScale.bodySm.size}px`,
    xl: `${typeScale.subheading.size}px`,
    xs: `${typeScale.caption.size}px`,
    xxl: `${typeScale.headingSm.size}px`,
  },
  fonts: {
    main: fonts.main,
    mono: fonts.mono,
  },
  fontWeights: {
    bold: fontWeights.bold,
    light: fontWeights.light,
    medium: fontWeights.medium,
    regular: fontWeights.regular,
    semibold: fontWeights.semibold,
  },
  layout: {
    cardPadding: `${layout.cardPadding}px`,
    elementGap: `${layout.elementGap}px`,
    gutter: 'clamp(16px, 4vw, 24px)',
    headerHeight: `${layout.headerHeight}px`,
    minTapTarget: `${layout.minTapTarget}px`,
    pageMaxWidth: `${layout.pageMaxWidth}px`,
    sectionGap: 'clamp(48px, 8vw, 96px)',
    sidebarWidth: `${layout.sidebarWidth}px`,
  },
  radii: {
    full: radii.tags,
    lg: radii.cards,
    md: radii.md,
    none: radii.none,
    sm: '6px',
  },
  spacing: {
    lg: `${spacing[24]}px`,
    md: `${spacing[16]}px`,
    sm: `${spacing[8]}px`,
    xl: `${spacing[32]}px`,
    xs: '4px',
    xxl: `${spacing[48]}px`,
    xxxl: `${spacing[96]}px`,
  },
  transitions: {
    fast: transitions.fast,
    medium: transitions.medium,
    slow: transitions.slow,
  },
  typography,
  zIndices: {
    dropdown: zIndex.dropdown,
    fixed: zIndex.fixed,
    modal: zIndex.modal,
    popover: zIndex.popover,
    sticky: zIndex.sticky,
    toast: zIndex.toast,
    tooltip: zIndex.tooltip,
  },
};

function colorsFor(mode: ThemeMode): DefaultTheme['colors'] {
  const t = tokens(mode);
  const c = chrome[mode];
  return {
    background: t.surface.base,
    backgroundAlt: c.band,
    border: t.border.subtle,
    borderStrong: t.border.strong,
    buy: t.intent.success,
    disabled: t.text.tertiary,
    error: t.intent.danger,
    errorSurface: c.alert.error.bg,
    hover: t.surface.hover,
    info: t.intent.info,
    infoSurface: t.accent.muted,
    onBuy: t.intent.onSuccess,
    // The ink that goes on the matching intent fill — same token MUI's
    // `<intent>.contrastText` reads. See task-10-report.md.
    onError: t.intent.onDanger,
    onInfo: t.intent.onInfo,
    // Same token MUI's `primary.contrastText` reads — one ink, two consumers.
    onPrimary: t.accent.onPrimary,
    onSell: t.intent.onDanger,
    onSuccess: t.intent.onSuccess,
    onWarning: t.intent.onWarning,
    primary: t.accent.primary,
    primaryBorder: c.primaryBorder,
    primaryHover: t.accent.primaryHover,
    primarySurface: t.accent.muted,
    // Background role: calibrated so `colors.text` stays legible on top of it
    // (the ~10 `background:` consumers). See task-2-report.md, Fix round 2.
    secondary: t.accent.muted,
    sell: t.intent.danger,
    success: t.intent.success,
    successSurface: c.alert.success.bg,
    surface: t.surface.raised,
    surfaceHover: t.surface.hover,
    text: t.text.primary,
    // Foreground role: the sibling `colors.secondary` can't also be — see
    // the doc comment on `DefaultTheme.colors.textMuted` in styled.d.ts.
    textMuted: t.text.secondary,
    textOnPrimary: t.accent.onPrimary,
    textSecondary: t.text.secondary,
    // Held to the same 4.5:1 floor as every other text role: least emphasis,
    // but still read.
    textSubtle: t.text.tertiary,
    warning: t.intent.warning,
    warningSurface: c.alert.warning.bg,
  };
}

export const lightTheme: DefaultTheme = {
  ...shared,
  colors: colorsFor('light'),
  focusRing: { ...focusRing, color: tokens('light').accent.primary },
  mode: 'light',
  shadows,
};

export const darkTheme: DefaultTheme = {
  ...shared,
  colors: colorsFor('dark'),
  focusRing: { ...focusRing, color: tokens('dark').accent.primary },
  mode: 'dark',
  shadows: darkShadows,
};
