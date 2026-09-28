/**
 * Design Tokens — "precision instrument"
 *
 * Single source of truth for the non-colour parts of the visual system (type,
 * radii, spacing, elevation, motion) and for the raw palette the semantic
 * colour roles in `src/theme/tokens/semantic.ts` are drawn from. Components
 * that need a colour should ask `tokens(mode)` for a role, not reach for a
 * palette key here.
 *
 * Core principles of the system:
 *   - Apple-neutral ground; numbers are the hero and chrome recedes into material
 *   - One accent, the logo's indigo, reserved for primary action and selection
 *   - Depth is a soft two-layer shadow in light mode and a hairline in dark mode,
 *     never both on one surface
 *   - Semibold titles, regular body, tabular numerals everywhere
 *   - 10px on operable controls, 16px on cards, 24px on the shell
 */

/**
 * Palette — Apple neutrals plus a single indigo accent.
 *
 * Key names predate this system and are kept so call sites stay stable; the
 * comments describe the role each key now plays.
 */
export const palette = {
  /** Soft accent stroke for focus halos and outline emphasis */
  amethystEdge: '#8b7cff',
  /** Deepest accent, for text on accent-tinted surfaces */
  deepViolet: '#1f1a4d',
  /** Opaque separator and hover fill on white */
  frost: '#e8e8ed',
  /** Accent for links and emphasized short phrases on light surfaces */
  indigoHover: '#4a34f0',
  /** The accent — primary buttons, current selection, focus */
  indigoInk: '#533afd',
  /** Accent-tinted border for selected outline controls */
  lavenderBorder: '#cdc6ff',
  /** Faint accent-tinted divider */
  lilacBorder: '#e3dfff',
  /** Primary text — Apple label */
  midnightInk: '#1d1d1f',
  /** Grouped background band */
  mist: '#f5f5f7',
  /** Accent-tinted surface for selected rows and tags */
  periwinkleWash: '#efedff',
  /** Elevated surfaces: cards, sheets, popovers */
  pureWhite: '#ffffff',
  /** The ground the shell and every card sit on */
  shellCanvas: '#f5f5f7',
  /**
   * Secondary label — passes 4.5:1 on white, the ground, hover fills and
   * segmented tracks (Apple's #6e6e73 is 4.15:1 on the #e8e8ed hover fill).
   */
  slate: '#66666b',
  /** Tertiary, decorative only (disabled, placeholders on large type) */
  smoke: '#aeaeb2',
  /** Strong secondary text */
  steel: '#424245',
} as const;

/**
 * Semantic status colors — Apple system hues, tuned for 4.5:1 on white.
 * Used only where meaning demands it: order side, outcome, validation.
 */
export const status = {
  buy: '#1d7f39',
  danger: '#d70015',
  dangerSurface: '#fff1f1',
  info: palette.indigoInk,
  infoSurface: palette.periwinkleWash,
  sell: '#d70015',
  success: '#1d7f39',
  successSurface: '#eef8f0',
  warning: '#a35200',
  warningSurface: '#fff6ea',
} as const;

/** Surface levels. */
export const surfaces = {
  band: palette.mist,
  canvas: palette.pureWhite,
  frosted: palette.frost,
  indigo: palette.indigoInk,
  lavender: palette.periwinkleWash,
} as const;

/**
 * Dark-mode palette — Apple's dark grouped system: a true-black ground,
 * graphite surfaces, and hairlines standing in for shadow.
 */
export const darkPalette = {
  band: '#1c1c1e',
  border: '#2c2c2e',
  borderStrong: '#3a3a3c',
  canvas: '#000000',
  frosted: '#2c2c2e',
  indigoHover: '#9d91ff',
  indigoInk: '#7f70ff',
  lavender: '#1f1b3d',
  smoke: '#636366',
  text: '#f5f5f7',
  textMuted: '#98989d',
  textSecondary: '#aeaeb2',
} as const;

/**
 * Materials — translucent chrome that lets content read through it, the way
 * macOS toolbars do. Only the top bar and floating sheets use these.
 */
export const materials = {
  dark: 'rgba(28, 28, 30, 0.72)',
  filter: 'saturate(180%) blur(20px)',
  light: 'rgba(255, 255, 255, 0.72)',
} as const;

/**
 * Chrome — the translucent fills, halos and tints MUI's component overrides
 * paint with, per mode. These are materials rather than colour roles (most are
 * alpha over whatever sits underneath), so they live here beside `materials`
 * instead of in the semantic tokens; `src/theme/mui-theme.ts` reads them by
 * name so it names no colour of its own.
 */
export const chrome = {
  dark: {
    /** Standard alert tints: a deep wash with a light ink on top. */
    alert: {
      error: { bg: '#3a1210', fg: '#ff9a93' },
      info: { fg: darkPalette.indigoHover },
      success: { bg: '#0c2a16', fg: '#6ee38c' },
      warning: { bg: '#33230a', fg: '#ffc061' },
    },
    appBar: materials.dark,
    backdrop: 'rgba(0, 0, 0, 0.56)',
    /** Quiet grouped band behind a section */
    band: darkPalette.band,
    buttonShadow: 'none',
    // Materials the premium components (`src/components/premium`) paint with.
    /** Hairline ring + soft lift on a resting card; dark mode uses a border instead. */
    cardRing: 'none',
    containedErrorHover: '#ff6259',
    containedSuccessHover: '#4cd96f',
    /** Error halo around a focused invalid field. */
    dangerHalo: 'rgba(255, 69, 58, 0.28)',
    /** Apple's translucent control fill: reads on any ground. */
    fill: 'rgba(118, 118, 128, 0.24)',
    fillHover: 'rgba(118, 118, 128, 0.32)',
    /** Quieter translucent fill, for wells inside a card. */
    fillSubtle: 'rgba(118, 118, 128, 0.18)',
    /** Single hairline ring; dark mode uses a border instead. */
    hairlineRing: 'none',
    /** Focus halo around the accent. */
    halo: 'rgba(127, 112, 255, 0.32)',
    /** Stronger accent halo, for focus on chart and chrome controls. */
    haloStrong: 'rgba(127, 112, 255, 0.55)',
    inputBg: 'rgba(118, 118, 128, 0.12)',
    inputHoverBorder: '#48484a',
    listHover: 'rgba(255, 255, 255, 0.05)',
    listPressed: 'rgba(255, 255, 255, 0.08)',
    popBorder: darkPalette.borderStrong,
    popoverShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.18)',
    popShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
    /** Accent-tinted border for selected outline controls */
    primaryBorder: '#4a3fa8',
    rowHover: 'rgba(255, 255, 255, 0.04)',
    segmentThumb: '#3a3a3c',
    segmentThumbShadow: 'none',
    /** Depth for a modal sheet; dark mode pairs it with a strong-border ring. */
    sheetShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
    skeletonWave: 'rgba(255, 255, 255, 0.06)',
    snackbar: '#2c2c2e',
    switchThumb: '#ffffff',
    switchThumbShadow: '0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.16)',
    switchTrack: 'rgba(120, 120, 128, 0.32)',
    /** The raised pill a segmented selection rides on. */
    thumb: '#636366',
    thumbShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
    ticketShadow: 'none',
    tileShadow: 'none',
    /** Toast depth; dark mode pairs it with a strong-border ring. */
    toastShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 12px 32px rgba(0, 0, 0, 0.5)',
    tooltip: 'rgba(58, 58, 60, 0.92)',
  },
  light: {
    alert: {
      error: { bg: '#fff1f1', fg: '#a3000f' },
      info: { fg: palette.deepViolet },
      success: { bg: '#eef8f0', fg: '#135c28' },
      warning: { bg: '#fff6ea', fg: '#7a3d00' },
    },
    appBar: materials.light,
    backdrop: 'rgba(0, 0, 0, 0.24)',
    band: palette.mist,
    buttonShadow: '0 1px 2px rgba(83, 58, 253, 0.24)',
    cardRing: '0 0 0 1px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.05)',
    containedErrorHover: '#b80012',
    containedSuccessHover: '#176b30',
    dangerHalo: 'rgba(215, 0, 21, 0.16)',
    fill: 'rgba(118, 118, 128, 0.12)',
    fillHover: 'rgba(118, 118, 128, 0.18)',
    fillSubtle: 'rgba(118, 118, 128, 0.08)',
    hairlineRing: '0 0 0 1px rgba(0, 0, 0, 0.06)',
    halo: 'rgba(83, 58, 253, 0.18)',
    haloStrong: 'rgba(83, 58, 253, 0.35)',
    inputBg: '#ffffff',
    inputHoverBorder: '#b0b0b8',
    listHover: 'rgba(0, 0, 0, 0.035)',
    listPressed: 'rgba(0, 0, 0, 0.06)',
    popBorder: 'rgba(0, 0, 0, 0.04)',
    popoverShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.18)',
    popShadow: '0 2px 4px rgba(0, 0, 0, 0.04), 0 12px 32px rgba(0, 0, 0, 0.08)',
    primaryBorder: palette.lavenderBorder,
    rowHover: 'rgba(0, 0, 0, 0.025)',
    segmentThumb: '#ffffff',
    segmentThumbShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 3px 8px rgba(0, 0, 0, 0.06)',
    sheetShadow: '0 1px 2px rgba(0, 0, 0, 0.06), 0 28px 56px -24px rgba(0, 0, 0, 0.35)',
    skeletonWave: 'rgba(255, 255, 255, 0.7)',
    snackbar: 'rgba(29, 29, 31, 0.92)',
    switchThumb: '#ffffff',
    switchThumbShadow: '0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.16)',
    switchTrack: 'rgba(120, 120, 128, 0.16)',
    thumb: '#ffffff',
    thumbShadow: '0 1px 2px rgba(0, 0, 0, 0.08), 0 3px 8px rgba(0, 0, 0, 0.06)',
    ticketShadow: '0 0 0 1px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)',
    tileShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.08)',
    toastShadow:
      '0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.04), 0 12px 32px rgba(0, 0, 0, 0.1)',
    tooltip: 'rgba(29, 29, 31, 0.9)',
  },
} as const;

/**
 * Elevation — soft, two-layer, offset-down shadows. Light mode only: dark
 * surfaces separate by a hairline instead, since shadow does not read on black.
 */
export const shadows = {
  /** `MuiCard`'s resting elevation: the same soft lift as `sm`. */
  card: '0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 1px rgba(0, 0, 0, 0.03)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  lg: '0 2px 4px rgba(0, 0, 0, 0.04), 0 12px 32px rgba(0, 0, 0, 0.08)',
  md: '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.05)',
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 1px rgba(0, 0, 0, 0.03)',
  xl: '0 4px 8px rgba(0, 0, 0, 0.05), 0 24px 64px rgba(0, 0, 0, 0.16)',
  xxl: '0 4px 8px rgba(0, 0, 0, 0.05), 0 24px 64px rgba(0, 0, 0, 0.16)',
};

/**
 * Dark mode elevation. Resting surfaces carry no shadow — they separate by a
 * hairline border — and only floating layers (sheets, popovers, dialogs) keep
 * one, deep enough to read against black.
 */
export const darkShadows = {
  card: 'none',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4)',
  lg: 'none',
  md: 'none',
  none: 'none',
  sm: 'none',
  xl: '0 24px 64px rgba(0, 0, 0, 0.6)',
  xxl: '0 24px 64px rgba(0, 0, 0, 0.6)',
};

/**
 * Full-viewport backdrop behind a modal. Deliberately mode-invariant, unlike
 * every other colour in this file: darkening whatever sits behind the modal
 * is the same job in light or dark mode, since the modal itself (not the
 * scrim) is what needs to read correctly per mode.
 *
 * Two strengths, matching the two that already existed independently before
 * this token: `scrim` for the general-purpose `Modal`, `scrimStrong` for the
 * Ledger hardware-wallet flow's three modals, which pull the background
 * further out of focus during a security-critical device interaction.
 */
export const scrim = 'rgba(0, 0, 0, 0.6)';
export const scrimStrong = 'rgba(0, 0, 0, 0.7)';

/**
 * Focus ring — the one place a visible outline is required. Uses the indigo
 * accent so keyboard focus reads as an action affordance.
 */
export const focusRing = {
  color: palette.indigoInk,
  offset: '2px',
  width: '2px',
} as const;

/**
 * Motion. One curve for everything that moves, so the app feels like a
 * single physical system.
 */
export const transitions = {
  fast: '160ms cubic-bezier(0.32, 0.72, 0, 1)',
  medium: '240ms cubic-bezier(0.32, 0.72, 0, 1)',
  slow: '420ms cubic-bezier(0.32, 0.72, 0, 1)',
  slowest: '700ms cubic-bezier(0.32, 0.72, 0, 1)',
};

/**
 * The one spring every sliding selection, sheet and press uses, so motion
 * feels like one physical system.
 */
export const spring = { damping: 38, mass: 0.8, stiffness: 520, type: 'spring' } as const;

/**
 * Timing functions for advanced animations
 */
export const easing = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
};

/**
 * Z-index layers for stacking context
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  sticky: 1100,
  toast: 1500,
  tooltip: 1600,
};

/**
 * Radius scale. Operable controls are 10px, cards 16px, the floating shell
 * 24px, and tags are pills. Nothing outside RADIUS_SCALE is permitted.
 */
export const radii = {
  buttons: '10px',
  cards: '16px',
  inputs: '10px',
  md: '10px',
  none: '0',
  round: '50%',
  /** The floating application shell and the navigation rail. */
  shell: '24px',
  tags: '9999px',
} as const;

/** Every radius the system allows, in px. */
export const RADIUS_SCALE = [0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 40] as const;

/**
 * Border radius by size, for call sites that predate `radii`'s role names.
 * Values sit on RADIUS_SCALE.
 */
export const borderRadius = {
  full: '9999px',
  lg: '12px',
  md: '8px',
  none: '0',
  round: '50%',
  sm: '4px',
  xl: '16px',
  xxl: '24px',
};

/**
 * Spacing scale — 8px base unit, comfortable density. Indexed both by pixel
 * value (`spacing[16]`) and by the older size names (`spacing.md`); the two
 * name the same steps.
 */
export const spacing = {
  0: 0,
  8: 8,
  16: 16,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  64: 64,
  80: 80,
  96: 96,
  lg: 24,
  md: 16,
  sm: 8,
  xl: 32,
  xs: 4,
  xxl: 48,
  xxxl: 64,
} as const;

/** Base unit for MUI's `spacing()` and any arithmetic layout math. */
export const spacingUnit = 8;

/**
 * Breakpoints in pixels. Numeric so they can be composed into media queries
 * and MUI's breakpoint map without string surgery.
 */
export const breakpoints = {
  desktop: 1280,
  mobile: 768,
  sm: 600,
  tablet: 1024,
  wide: 1536,
  xs: 0,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

/**
 * Type family. On Apple platforms the system stack resolves to SF Pro; the
 * self-hosted Inter variable face (CSP allows `self` fonts) covers everything
 * else with the same metrics family and tabular figures.
 */
export const fonts = {
  main: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter Variable", "Inter", system-ui, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
} as const;

/** Tabular numerals for every price, balance and metric. */
export const fontFeatures = '"tnum" on, "cv11" on';

/**
 * Weights: regular body, medium for controls and labels, semibold for titles.
 * `light` is kept as an alias of regular for older call sites.
 */
export const fontWeights = {
  bold: 700,
  extrabold: 800,
  light: 400,
  medium: 500,
  regular: 400,
  semibold: 600,
} as const;

/**
 * Font sizes in pixels
 */
export const fontSizes = {
  display: 36,
  lg: 18,
  md: 16,
  sm: 14,
  xl: 20,
  xs: 12,
  xxl: 24,
  xxxl: 30,
};

/**
 * Line heights
 */
export const lineHeights = {
  loose: 2,
  normal: 1.5,
  relaxed: 1.75,
  tight: 1.2,
};

/**
 * Letter spacing
 */
export const letterSpacing = {
  normal: '0',
  tight: '-0.025em',
  tighter: '-0.05em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
};

/**
 * Type scale, modelled on Apple's: tracking tightens as size grows but never
 * past -0.03em.
 */
export const typeScale = {
  body: { lineHeight: 1.47, size: 15, tracking: '-0.15px', weight: fontWeights.regular },
  bodyLg: { lineHeight: 1.47, size: 17, tracking: '-0.3px', weight: fontWeights.regular },
  bodySm: { lineHeight: 1.43, size: 13, tracking: '-0.08px', weight: fontWeights.regular },
  caption: { lineHeight: 1.33, size: 12, tracking: '0px', weight: fontWeights.regular },
  display: { lineHeight: 1.05, size: 56, tracking: '-1.6px', weight: fontWeights.semibold },
  heading: { lineHeight: 1.12, size: 30, tracking: '-0.6px', weight: fontWeights.semibold },
  headingLg: { lineHeight: 1.08, size: 44, tracking: '-1.1px', weight: fontWeights.semibold },
  headingSm: { lineHeight: 1.2, size: 22, tracking: '-0.4px', weight: fontWeights.semibold },
  subheading: { lineHeight: 1.26, size: 17, tracking: '-0.3px', weight: fontWeights.semibold },
} as const;

export type TypeScaleKey = keyof typeof typeScale;

/**
 * Layout constants.
 */
export const layout = {
  /** Internal padding of a content card */
  cardPadding: 24,
  /** Default gap between adjacent inline elements */
  elementGap: 8,
  /** Horizontal gutter — scales down on narrow viewports */
  gutter: 24,
  gutterMobile: 16,
  /** Fixed application header height */
  headerHeight: 64,
  headerHeightMobile: 64,
  /** Minimum interactive target — WCAG 2.5.5 */
  minTapTarget: 44,
  /** Minimum supported viewport width */
  minViewportWidth: 320,
  /** Centered content column */
  pageMaxWidth: 1320,
  /** Vertical rhythm between major page sections */
  sectionGap: 96,
  /** Persistent navigation rail */
  sidebarWidth: 260,
} as const;

/**
 * Data visualization ramp.
 *
 * Charts use the accent plus graphite neutrals so they read as part of the
 * instrument rather than as a separate palette. Buy/sell keep the semantic status hues.
 */
export const chartColors = [
  palette.indigoInk,
  '#8e8e93',
  '#b3a9ff',
  '#48484a',
  '#d8d3ff',
  palette.deepViolet,
] as const;

/**
 * Renders a type-scale entry as a CSS declaration block.
 * Used by GlobalStyles and any styled component that wants the full spec.
 */
export const typeStyle = (key: TypeScaleKey): string => {
  const { size, lineHeight, tracking, weight } = typeScale[key];
  return [
    `font-size: ${size}px`,
    `line-height: ${lineHeight}`,
    `letter-spacing: ${tracking}`,
    `font-weight: ${weight}`,
  ].join(';\n  ');
};

/** `px` helper for composing spacing values in template literals. */
export const px = (value: number): string => `${value}px`;
