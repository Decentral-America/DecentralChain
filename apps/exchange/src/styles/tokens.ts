/**
 * Design Tokens
 * Reusable design values exported as JavaScript objects
 * Can be used standalone or via theme
 */

/**
 * Shadow tokens for depth and elevation
 */
export const shadows = {
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  xxl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

/**
 * Dark mode shadows with higher opacity
 */
export const darkShadows = {
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
  xxl: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
};

/**
 * Transition tokens for consistent animations
 */
export const transitions = {
  fast: '150ms ease-in-out',
  medium: '300ms ease-in-out',
  slow: '500ms ease-in-out',
  slowest: '700ms ease-in-out',
};

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
 * Border radius tokens
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
 * Spacing scale (matches theme spacing but in pixels for non-styled usage)
 */
export const spacing = {
  lg: 24,
  md: 16,
  sm: 8,
  xl: 32,
  xs: 4,
  xxl: 48,
  xxxl: 64,
};

/**
 * Breakpoint values (matches theme breakpoints)
 */
export const breakpoints = {
  desktop: 1280,
  mobile: 768,
  tablet: 1024,
  wide: 1536,
};

/**
 * Font weights
 */
export const fontWeights = {
  bold: 700,
  extrabold: 800,
  light: 300,
  medium: 500,
  regular: 400,
  semibold: 600,
};

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
 * Type scale, palette and radii — ported from the standalone exchange app's
 * dark-landing/mobile design system (not yet reconciled with this app's own
 * `borderRadius`/theme tokens above). Scoped to the components that came over
 * with them (Swap page, mobile shell, PageFrame) until that reconciliation
 * happens.
 */
export const typeScale = {
  body: { lineHeight: 1.2, size: 16, tracking: '-0.16px', weight: fontWeights.regular },
  bodyLg: { lineHeight: 1.4, size: 20, tracking: '-0.2px', weight: fontWeights.light },
  bodySm: { lineHeight: 1.4, size: 14, tracking: '-0.14px', weight: fontWeights.regular },
  caption: { lineHeight: 1.45, size: 12, tracking: '-0.12px', weight: fontWeights.regular },
  display: { lineHeight: 1.03, size: 56, tracking: '-1.4px', weight: fontWeights.light },
  heading: { lineHeight: 1.1, size: 32, tracking: '-0.64px', weight: fontWeights.light },
  headingLg: { lineHeight: 1.03, size: 48, tracking: '-0.96px', weight: fontWeights.light },
  headingSm: { lineHeight: 1.12, size: 26, tracking: '-0.26px', weight: fontWeights.light },
  subheading: { lineHeight: 1.1, size: 22, tracking: '-0.22px', weight: fontWeights.light },
} as const;

export type TypeScaleKey = keyof typeof typeScale;

export const palette = {
  /** Mid-violet outline border for developer-facing buttons */
  amethystEdge: '#7f71e6',
  /** Heaviest accent stroke — rare, reads almost as navy */
  deepViolet: '#182659',
  /** Primary border color, subtle surface tint, button hover background */
  frost: '#e5edf5',
  /** Violet text accent for links and emphasized short phrases */
  indigoHover: '#7389ff',
  /** Violet action color — filled buttons, selected nav, focused conversion */
  indigoInk: '#533afd',
  /** Hairline outline button border */
  lavenderBorder: '#b9b9f9',
  /** Secondary outline button border and softer dividers */
  lilacBorder: '#d6d9fc',
  /** Primary heading and body text — near-black with cool blue undertone */
  midnightInk: '#061b31',
  /** Footer background and section banding */
  mist: '#f8fafd',
  /** Lightest violet surface — tinted cards, tag pills, emphasis blocks */
  periwinkleWash: '#e8e9ff',
  /** Page canvas and elevated card surfaces */
  pureWhite: '#ffffff',
  /**
   * The ground the application shell floats on. Neutral rather than the blue
   * tints above: a surface behind white cards should read as absence of colour,
   * not as a colour of its own.
   */
  shellCanvas: '#eef0f3',
  /** Gray text accent for links, tags, labels */
  slate: '#64748d',
  /** Muted violet-tinted text for large decorative headings */
  smoke: '#839bc8',
  /** Tertiary body text and helper copy */
  steel: '#50617a',
} as const;

export const radii = {
  buttons: '8px',
  cards: '16px',
  inputs: '8px',
  md: '8px',
  none: '0',
  round: '50%',
  /** The floating application shell and the navigation rail. */
  shell: '24px',
  tags: '9999px',
} as const;

/**
 * Layout constants, ported alongside the type scale/palette/radii above.
 */
export const layout = {
  /** Internal padding of a content card */
  cardPadding: 32,
  /** Default gap between adjacent inline elements */
  elementGap: 8,
  /** Horizontal gutter — scales down on narrow viewports */
  gutter: 24,
  gutterMobile: 16,
  /** Fixed application header height */
  headerHeight: 76,
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

export const fonts = {
  main: '"sohne-var", "Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
} as const;

/**
 * Semantic status colors, ported alongside `palette`/`radii` above.
 */
export const status = {
  buy: '#127f5b',
  danger: '#b3261e',
  dangerSurface: '#fdf1f0',
  info: palette.indigoInk,
  infoSurface: palette.periwinkleWash,
  sell: '#b3261e',
  success: '#127f5b',
  successSurface: '#eff7f3',
  warning: '#8a5a00',
  warningSurface: '#fdf6e9',
} as const;
