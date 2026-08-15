/**
 * Mobile Design Tokens
 *
 * The application runs two related but distinct visual systems:
 *
 *   - Desktop and marketing follow the ledger reference in ./tokens.ts —
 *     flat surfaces, 4px radii, hairline rules, no elevation.
 *   - Mobile follows a native-app language: rounded cards, a tinted gradient
 *     header, soft elevation, pill actions, and a floating tab bar.
 *
 * They deliberately share the palette and the type family, so the product
 * still reads as one brand; only the surface treatment differs. Keeping the
 * mobile values here rather than scattering them across components means the
 * two systems can never quietly blend into each other.
 */

import { fonts, palette, status } from './tokens';

/**
 * Accent ramp. The base indigo is shared with the desktop system; the mobile
 * layer adds the deeper tones the gradient header and pressed states need.
 */
export const mobileAccent = {
  base: palette.indigoInk,
  bright: '#6C5CE7',
  /** Deep tone anchoring the header gradient */
  deep: '#1B1046',
  hover: palette.indigoHover,
  /** Near-black navy at the top of the header gradient */
  night: '#0B0724',
  /** Soft violet wash behind selected chips and icon plates */
  wash: '#EEEBFF',
} as const;

/**
 * Brand mark and notification tones used by the app bar. Declared here so the
 * app bar has no raw colour literals of its own.
 */
export const mobileBrand = {
  markFrom: '#A48CFF',
  markMid: '#6C4CE0',
  markTo: '#4B2FA8',
  /** Unread indicator — a neutral notification blue, not a status colour */
  notification: '#4C7DFF',
} as const;

/**
 * Header gradient — the single place the mobile system uses a colour ramp.
 * It reads as a branded chrome band, not as elevation.
 */
export const mobileGradient = {
  header: `linear-gradient(125deg, #0B0724 0%, #1B1046 38%, #3C1B7A 68%, #5E2CA5 100%)`,
} as const;

/**
 * Surfaces. Mobile sits cards on a faintly tinted canvas so that white cards
 * read as raised without needing a heavy shadow.
 */
export const mobileSurface = {
  border: '#ECEDF1',
  canvas: '#F4F5F7',
  card: palette.pureWhite,
  chip: '#F1F2F5',
  sunken: '#F7F8FA',
} as const;

export const mobileText = {
  muted: '#9AA0AA',
  onAccent: palette.pureWhite,
  /** Supporting copy on the branded band — violet-tinted, never plain grey */
  onBandMuted: '#B9A8E8',
  primary: '#0F1115',
  secondary: '#6B7280',
} as const;

/** Positive / negative movement. Mobile uses a warmer negative than desktop. */
export const mobileMarket = {
  down: '#F97316',
  downStrong: '#EF4444',
  up: '#16A34A',
} as const;

/**
 * Radii. Mobile is generously rounded — this is the clearest departure from
 * the desktop system and the main reason the two token sets are separate.
 */
export const mobileRadius = {
  card: '20px',
  md: '14px',
  pill: '9999px',
  sheet: '28px',
  sm: '10px',
} as const;

/**
 * Elevation. Deliberately soft and low-contrast: enough to lift a card off
 * the tinted canvas, never enough to read as a drop shadow.
 */
export const mobileShadow = {
  accent: '0 6px 16px rgba(83, 58, 253, 0.32)',
  card: '0 2px 12px rgba(16, 20, 40, 0.05)',
  raised: '0 6px 20px rgba(16, 20, 40, 0.08)',
  tabBar: '0 -2px 16px rgba(16, 20, 40, 0.06)',
} as const;

/** Layout constants for the mobile shell. */
export const mobileLayout = {
  cardPadding: 16,
  gutter: 16,
  headerHeight: 56,
  minTapTarget: 44,
  /** Space reserved at the bottom of scroll areas so the tab bar never covers content */
  scrollPaddingBottom: 96,
  tabBarHeight: 64,
} as const;

/**
 * Fluid type.
 *
 * Each step interpolates with the viewport instead of stepping at breakpoints,
 * so text is proportionate on a 320px phone and a 430px one without a cascade
 * of per-breakpoint overrides. The clamp floor is the smallest size that stays
 * legible; the ceiling stops type growing past its design size on tablets.
 */
export const mobileFluid = {
  body: 'clamp(14px, 3.9vw, 15px)',
  caption: 'clamp(11px, 3.1vw, 12px)',
  /**
   * Figures inside cards scale with the card, not the viewport, so a stat
   * reads correctly whether its card is full width or one of two columns.
   * `cqi` units require the card to declare `container-type: inline-size`.
   */
  cardFigure: 'clamp(17px, 8cqi, 24px)',
  cardLabel: 'clamp(10px, 3.4cqi, 12px)',
  display: 'clamp(24px, 6.8vw, 30px)',
  heading: 'clamp(16px, 4.4vw, 18px)',
  hero: 'clamp(26px, 7.4vw, 34px)',
  label: 'clamp(12px, 3.4vw, 13px)',
  title: 'clamp(18px, 5.2vw, 22px)',
} as const;

/**
 * Type scale tuned for small screens: tighter leading and a larger step
 * between display figures and labels than the desktop scale uses.
 */
export const mobileType = {
  body: { lineHeight: 1.45, size: 15, tracking: '-0.1px', weight: 400 },
  caption: { lineHeight: 1.35, size: 12, tracking: '0px', weight: 400 },
  display: { lineHeight: 1.15, size: 32, tracking: '-0.6px', weight: 700 },
  heading: { lineHeight: 1.25, size: 18, tracking: '-0.3px', weight: 600 },
  label: { lineHeight: 1.35, size: 13, tracking: '0px', weight: 500 },
  title: { lineHeight: 1.2, size: 22, tracking: '-0.4px', weight: 700 },
} as const;

export const mobileFont = fonts.main;

/** Semantic status colours reused from the shared palette. */
export const mobileStatus = status;
