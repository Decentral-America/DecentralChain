/**
 * Mobile Design Tokens
 *
 * The mobile layer (below the 768px breakpoint) is a separate component tree,
 * but it lives in the same Apple world as desktop: the neutral ground, white
 * grouped surfaces, one indigo accent, semibold titles and one spring.
 *
 * Every value here is derived from ./tokens.ts or from the CSS custom
 * properties that index.css builds from it. Colours are expressed as CSS
 * variables rather than hex, so dark mode (true black ground, graphite
 * surfaces, hairlines instead of shadow) follows `data-theme` without any
 * per-component branching, and the two systems cannot drift apart again.
 *
 * What remains mobile-specific is layout: the tab bar, the large-title header,
 * the 44px tap-target floor and the safe-area arithmetic.
 */

import { fonts, layout, materials, radii, spring, status, typeScale } from './tokens';

/** The accent, its hover and its tinted wash — all theme-aware. */
export const mobileAccent = {
  base: 'var(--color-indigo-ink)',
  /** A lighter step of the accent, for secondary series in small charts */
  bright: 'var(--color-amethyst-edge)',
  hover: 'var(--color-indigo-hover)',
  /** Tinted fill behind accent glyphs: quick actions, selected rows */
  wash: 'var(--surface-lavender)',
} as const;

/**
 * Surfaces. The ground is Apple's grouped background; cards and sheets are the
 * elevated surface on top of it. `chip` and `sunken` are the translucent
 * system fill used for search fields, avatars and neutral buttons.
 */
export const mobileSurface = {
  border: 'var(--border-default)',
  borderStrong: 'var(--border-strong)',
  canvas: 'var(--surface-ground)',
  card: 'var(--surface-canvas)',
  chip: 'var(--surface-fill)',
  sunken: 'var(--surface-fill)',
} as const;

export const mobileText = {
  /** Secondary lines under a row title. Slate passes 4.5:1 on both surfaces. */
  muted: 'var(--text-secondary)',
  onAccent: 'var(--color-pure-white)',
  primary: 'var(--text-primary)',
  secondary: 'var(--text-secondary)',
  /** Decorative only: chevrons, placeholders on large type */
  tertiary: 'var(--text-subtle)',
} as const;

/** Positive / negative movement: the same system green and red as desktop. */
export const mobileMarket = {
  down: 'var(--color-sell)',
  downStrong: 'var(--color-sell)',
  up: 'var(--color-buy)',
} as const;

/** Radii come straight from the shared scale: 10px controls, 16px cards, 20px sheets. */
export const mobileRadius = {
  card: radii.cards,
  md: radii.md,
  pill: radii.tags,
  sheet: '20px',
  sm: radii.md,
} as const;

/**
 * Elevation. Light mode lifts a surface with the soft two-layer shadow; dark
 * mode replaces it with a hairline, never both. Spread into an `sx` object.
 */
export const mobileElevation = {
  card: {
    '[data-theme="dark"] &': { boxShadow: '0 0 0 1px var(--border-default)' },
    boxShadow: 'var(--shadow-md)',
  },
} as const;

/** Kept for call sites that only need the light-mode value. */
export const mobileShadow = {
  accent: 'none',
  card: 'var(--shadow-md)',
  raised: 'var(--shadow-lg)',
  tabBar: 'none',
} as const;

/**
 * Chrome material: the translucent bar colour plus the vibrancy filter. Used
 * only by the header bar and the tab bar, which content scrolls beneath.
 */
export const mobileMaterial = {
  chrome: 'var(--material-chrome)',
  dark: materials.dark,
  filter: materials.filter,
  light: materials.light,
} as const;

/** Layout constants for the mobile shell. */
export const mobileLayout = {
  cardPadding: 16,
  gutter: layout.gutterMobile,
  /** The compact navigation bar, excluding the status-bar inset */
  headerHeight: 44,
  minTapTarget: layout.minTapTarget,
  /**
   * Extra breathing room at the end of a screen. The layout itself already
   * reserves the tab bar and the home-indicator inset.
   */
  scrollPaddingBottom: 32,
  /** Tab bar row, excluding the home-indicator inset */
  tabBarHeight: 56,
} as const;

/**
 * Fluid type. Steps interpolate with the viewport so a 320px phone and a 430px
 * one both read proportionately; ceilings match the fixed scale below.
 */
export const mobileFluid = {
  body: 'clamp(14px, 3.9vw, 15px)',
  caption: 'clamp(11px, 3.1vw, 12px)',
  /**
   * Figures inside cards scale with the card, not the viewport. `cqi` units
   * require the card to declare `container-type: inline-size`.
   */
  cardFigure: 'clamp(17px, 8cqi, 24px)',
  cardLabel: 'clamp(11px, 3.4cqi, 12px)',
  display: 'clamp(30px, 9.6vw, 40px)',
  heading: 'clamp(16px, 4.4vw, 17px)',
  hero: 'clamp(30px, 9.6vw, 40px)',
  label: 'clamp(12px, 3.4vw, 13px)',
  /** The iOS large title */
  largeTitle: 'clamp(30px, 8.7vw, 34px)',
  title: 'clamp(20px, 5.6vw, 22px)',
} as const;

/**
 * Type scale. Mirrors Apple's iOS text styles, built from the shared scale:
 * large title 34/600, title 22/600, headline 17/600, body 17 or 15, footnote 13.
 */
export const mobileType = {
  body: {
    lineHeight: typeScale.body.lineHeight,
    size: typeScale.body.size,
    tracking: typeScale.body.tracking,
    weight: typeScale.body.weight,
  },
  caption: {
    lineHeight: typeScale.caption.lineHeight,
    size: 13,
    tracking: typeScale.bodySm.tracking,
    weight: typeScale.caption.weight,
  },
  display: { lineHeight: 1.1, size: 40, tracking: '-0.03em', weight: 600 },
  heading: {
    lineHeight: typeScale.subheading.lineHeight,
    size: typeScale.subheading.size,
    tracking: typeScale.subheading.tracking,
    weight: typeScale.subheading.weight,
  },
  label: { lineHeight: 1.35, size: 13, tracking: '-0.08px', weight: 500 },
  largeTitle: { lineHeight: 1.12, size: 34, tracking: '-0.02em', weight: 600 },
  title: {
    lineHeight: typeScale.headingSm.lineHeight,
    size: typeScale.headingSm.size,
    tracking: typeScale.headingSm.tracking,
    weight: typeScale.headingSm.weight,
  },
} as const;

export const mobileFont = fonts.main;

/** The one spring every selection, sheet and press uses. */
export const mobileSpring = spring;

/** Semantic status colours reused from the shared palette. */
export const mobileStatus = {
  ...status,
  danger: 'var(--color-danger)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
} as const;
