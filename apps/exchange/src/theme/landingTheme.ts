import { layout as layoutTokens, palette, typeScale } from '@/styles/tokens';

/**
 * Brand tokens for the landing/marketing surfaces.
 *
 * This file used to open with a second full MUI theme — `export const
 * landingTheme = createTheme({...})`, 227 lines, hardcoded `mode: 'light'` —
 * which twelve pages wrapped themselves in and which is the reason the app
 * shipped a light/dark toggle that did nothing. Those twelve wrappers were
 * removed earlier in this project, leaving the theme object with **zero
 * importers**; it was not deleted then, and Rollup does not drop it (a
 * `createTheme(...)` call at module scope is not provably side-effect free),
 * so every one of its unique palette values was still being shipped in
 * `dist/assets/index-*.js`. The spec called for `landingTheme.ts` to be
 * merged into the single theme; deleting the dead object is the last half of
 * that, and it is verified against the built bundle rather than against the
 * import graph.
 *
 * What remains is what is actually used: the brand-token exports below, which
 * `GlassCard`, `MainLayout`, `MobileAuthScreen` and the landing components'
 * dark branches read. They are plain constants, not a theme.
 */

/**
 * Ported from the standalone exchange app's dark-landing design (the "night
 * canvas" treatment), which replaced an orange/blue gradient set that used to
 * live above this comment. Both call sites (HeroSection, BigCTA) moved across
 * at the same time, so there is no lingering reference to the old gradients.
 */

/** The band's stops, dark to light. */
export const brandInk = {
  deep: '#1b1046',
  lift: '#5e2ca5',
  night: '#0b0724',
  violet: '#3c1b7a',
} as const;

/**
 * Brand fields.
 *
 * These are the marketing surfaces, not application chrome. The stops are the
 * mobile header band's, so the two systems express one brand rather than two
 * that merely share an accent.
 */
export const brandGradient = {
  /** The signature indigo field — hero and closing panel. */
  band: `linear-gradient(125deg, ${brandInk.night} 0%, ${brandInk.deep} 38%, ${brandInk.violet} 68%, ${brandInk.lift} 100%)`,
  /**
   * The hero field. Vertical rather than the band's diagonal, and it stays
   * dark for most of its height so the bloom at the foot has somewhere to
   * arrive from — an evenly-lit field reads as flat colour, not depth.
   */
  heroField: `linear-gradient(180deg, ${brandInk.night} 0%, #150c38 52%, #2a1263 100%)`,
  /** A barely-there tint, for banding a section against the white ones. */
  wash: `linear-gradient(180deg, ${palette.pureWhite} 0%, ${palette.mist} 100%)`,
} as const;

/**
 * Aurora fields.
 *
 * Large, heavily-blurred radial washes that bleed across a dark canvas. They
 * are what stops a dark page reading as a flat black rectangle: the light has
 * a direction and the surface has depth, without any image being loaded.
 *
 * Positioned layers rather than backgrounds on the section itself, so content
 * sits above them and they can extend past the section's own edges.
 */
export const aurora = {
  /** Wide cool wash, for the top of a dark field. */
  crown: `radial-gradient(60% 50% at 50% 0%, ${brandInk.lift}66 0%, transparent 70%)`,
  /** Off-centre highlight, so the light is not perfectly symmetrical. */
  drift: `radial-gradient(45% 45% at 78% 30%, ${brandInk.lift}59 0%, transparent 72%)`,
  /**
   * The bright bloom that lifts the foot of a card or band. Centred just below
   * the edge rather than well past it, so most of the falloff lands inside the
   * element — pushed further out, a small card only catches the dim tail.
   */
  foot: `radial-gradient(95% 75% at 50% 104%, #5b2ff0 0%, ${brandInk.violet}00 74%)`,
} as const;

/** The dark canvas the marketing page is mostly built on. */
export const brandCanvas = {
  base: brandInk.night,
  /**
   * Glass card over an aurora field. Weak enough and the card disappears into
   * the brightest part of the bloom, which is exactly where these sit.
   */
  glass: 'rgba(255, 255, 255, 0.1)',
  /** Hairline that reads on dark without becoming a visible line. */
  hairline: '1px solid rgba(255, 255, 255, 0.16)',
  /** One step up, for a card sitting on the canvas. */
  raised: '#120c30',
} as const;

/**
 * Text tones for the dark canvas.
 *
 * Measured against the lightest stop any of these sit on, so they hold AA
 * wherever the aurora happens to bloom underneath.
 */
export const onCanvas = {
  muted: 'rgba(255, 255, 255, 0.66)',
  primary: '#ffffff',
  secondary: 'rgba(255, 255, 255, 0.82)',
} as const;

/**
 * `HeroSection`'s H1 text-fill in dark mode (`backgroundClip: 'text'`): a
 * light-violet highlight resolving into white down the lines. The violet is
 * the same hue `contourStroke` uses, at a much higher opacity — that one is a
 * background decoration, this is the headline's own ink, so the two can't
 * honestly share one constant. Declared after `onCanvas` because it composes
 * `onCanvas.primary` rather than repeating the literal.
 */
export const heroHeadlineGradient = `linear-gradient(180deg, rgba(196, 170, 255, 0.92) 0%, ${onCanvas.primary} 62%)`;

/**
 * `BlueprintFrame`'s measured grid and corner registration marks, on the dark
 * canvas only (the light-mode branch reads `palette.frost`/`lavenderBorder`
 * instead). Same translucent-white family as `onCanvas`, fainter still —
 * this is a background texture, not text, so it has no contrast floor to
 * clear.
 */
export const blueprintOnDark = {
  line: 'rgba(255, 255, 255, 0.07)',
  mark: 'rgba(255, 255, 255, 0.3)',
} as const;

/**
 * `BandTexture`'s hero/header contour motif — light lavender at low alpha,
 * legible against the dark canvas without competing with foreground content.
 * Decorative only (`aria-hidden`, takes no part in the accessibility tree),
 * so it has no AA obligation either; dark-only by the same design decision
 * documented on `BandTexture` itself.
 */
export const contourStroke = 'rgba(196, 170, 255, 0.4)';

/**
 * The animated mesh.
 *
 * Three oversized radial blobs in the band's own stops, drifting slowly past
 * each other. The atmosphere of the page: the canvas is never a flat fill,
 * it is lit from within and always faintly in motion. The drift is pure
 * transform, so it runs on the compositor, and it stops entirely under
 * prefers-reduced-motion.
 */
export const mesh = {
  blobA: `radial-gradient(42% 42% at 30% 30%, ${palette.indigoInk}59 0%, transparent 70%)`,
  blobB: `radial-gradient(38% 38% at 70% 40%, ${brandInk.lift}66 0%, transparent 72%)`,
  blobC: `radial-gradient(46% 46% at 50% 80%, ${brandInk.violet}73 0%, transparent 70%)`,
} as const;

/**
 * Card surface for marketing content.
 *
 * Softer than the application's 4px ledger cards: these hold a single idea
 * rather than a table, and a marketing page is read at a glance.
 */
export const brandSurface = {
  border: `1px solid ${palette.frost}`,
  /** Hairline that reads on the dark canvas. */
  borderOnDark: '1px solid rgba(255, 255, 255, 0.12)',
  /** A lift, not a drop shadow — depth without the surface looking detached. */
  lift: '0 1px 2px rgba(6, 27, 49, 0.04), 0 12px 32px rgba(6, 27, 49, 0.06)',
  /** For cards sitting on the dark band, where a border would disappear. */
  onBand: '0 24px 60px rgba(6, 27, 49, 0.28)',
  /** Feature panels bow out far beyond the app's card radius. */
  panel: '40px',
  radius: '16px',
} as const;

/**
 * Hero surface.
 *
 * The same indigo band the mobile shell opens every screen with, so the page
 * someone signs up from and the product they land in read as one thing. It is
 * the darkest field on the page by a wide margin, which is what lets the white
 * headline and the single indigo action carry the whole composition.
 *
 * Kept as an absolutely-positioned layer so existing call sites that render it
 * behind hero content continue to work unchanged.
 */
export const heroGradientStyles = {
  background: brandGradient.heroField,
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
  zIndex: 0,
} as const;

/**
 * CTA banner surface — the closing panel, carrying the same band as the hero
 * so the page opens and closes on the same note.
 */
export const ctaGradientStyles = {
  background: brandGradient.band,
  borderRadius: brandSurface.radius,
} as const;

/**
 * Shared marketing layout values, so sections keep a consistent measure and
 * vertical rhythm instead of each picking its own padding.
 */
export const landingLayout = {
  /** Small uppercase section label above a heading */
  eyebrow: {
    color: palette.slate,
    fontSize: typeScale.caption.size,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  /** Fluid horizontal gutter */
  gutter: 'clamp(16px, 4vw, 24px)',
  /** Centered content column */
  maxWidth: layoutTokens.pageMaxWidth,
  /** Fluid vertical gap between major sections */
  sectionPaddingY: 'clamp(48px, 8vw, 96px)',
} as const;
