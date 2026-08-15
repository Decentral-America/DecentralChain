import { createTheme } from '@mui/material/styles';
import { layout as layoutTokens, palette, typeScale } from '@/styles/tokens';

/**
 * Landing page theme following the design spec
 * Global theme & tokens with Inter font, custom color palette, and spacing
 */
export const landingTheme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          fontWeight: 500,
          textTransform: 'none',
        },
        sizeLarge: {
          fontSize: '16px',
          padding: '12px 24px',
        },
      },
      variants: [
        {
          props: { color: 'primary', variant: 'contained' },
          style: {
            '&:hover': {
              boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)',
            },
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E6EAF2',
          borderRadius: '14px',
          boxShadow: '0 10px 30px rgba(20, 32, 80, 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          fontWeight: 500,
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:900px)': {
            paddingLeft: '16px',
            paddingRight: '16px',
          },
          paddingLeft: '24px',
          paddingRight: '24px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
          },
        },
      },
    },
  },
  palette: {
    background: {
      default: '#F9FAFB', // gray-50
      paper: '#FFFFFF',
    },
    divider: '#EEF2F7',
    error: {
      main: '#EF4444',
    },
    grey: {
      50: '#F9FAFB',
      100: '#F2F4F7',
      200: '#E5E7EB',
      300: '#D0D5DD',
      400: '#98A2B3',
      500: '#667085',
      600: '#475467',
      700: '#344054',
      800: '#1F2937',
      900: '#111827',
    },
    mode: 'light',
    primary: {
      contrastText: '#FFFFFF',
      dark: '#2d1c8f',
      light: '#5940d4',
      main: '#3d26be', // Deep purple/indigo
    },
    secondary: {
      contrastText: '#FFFFFF',
      dark: '#0891B2',
      light: '#22D3EE',
      main: '#06B6D4', // Cyan for contrast
    },
    success: {
      main: '#10B981', // Emerald for success states
    },
    text: {
      primary: '#111827', // gray-900
      secondary: '#667085', // gray-500
    },
    warning: {
      main: '#F59E0B', // amber-500 (accent)
    },
  },
  shadows: [
    'none',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 4px 8px rgba(20, 32, 80, 0.06)',
    '0 8px 16px rgba(20, 32, 80, 0.08)',
    '0 10px 30px rgba(20, 32, 80, 0.08)', // Card shadow
    '0 12px 40px rgba(20, 32, 80, 0.10)',
    '0 16px 50px rgba(20, 32, 80, 0.12)',
    '0 20px 60px rgba(15, 25, 55, 0.15)', // Floating mockups
    '0 24px 70px rgba(15, 25, 55, 0.18)',
    '0 30px 80px rgba(15, 25, 55, 0.20)',
    '0 35px 90px rgba(15, 25, 55, 0.22)',
    '0 40px 100px rgba(15, 25, 55, 0.24)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
    '0 2px 4px rgba(20, 32, 80, 0.04)',
  ],
  shape: {
    borderRadius: 14, // Default card radius
  },
  spacing: 8, // 8px base
  typography: {
    body1: {
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '26px',
    },
    body2: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '22px',
    },
    caption: {
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: '18px',
    },
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: {
      '@media (max-width:900px)': {
        fontSize: '40px',
        lineHeight: 1.2,
      },
      '@media (max-width:1200px)': {
        fontSize: '48px',
      },
      fontSize: '56px',
      fontWeight: 700,
      letterSpacing: '-0.5px',
      lineHeight: 1.1,
    },
    h2: {
      '@media (max-width:900px)': {
        fontSize: '28px',
        lineHeight: '36px',
      },
      '@media (max-width:1200px)': {
        fontSize: '32px',
        lineHeight: '40px',
      },
      fontSize: '36px',
      fontWeight: 700,
      letterSpacing: '-0.3px',
      lineHeight: '44px',
    },
    h3: {
      '@media (max-width:900px)': {
        fontSize: '20px',
        lineHeight: '28px',
      },
      '@media (max-width:1200px)': {
        fontSize: '22px',
        lineHeight: '30px',
      },
      fontSize: '24px',
      fontWeight: 600,
      lineHeight: '32px',
    },
    h4: {
      fontSize: '20px',
      fontWeight: 500,
      lineHeight: '28px',
    },
    h5: {
      fontSize: '18px',
      fontWeight: 500,
      lineHeight: '26px',
    },
    h6: {
      fontSize: '16px',
      fontWeight: 600,
      lineHeight: '24px',
    },
    overline: {
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '0.12em',
      lineHeight: '18px',
      textTransform: 'uppercase' as const,
    },
    subtitle1: {
      fontSize: 16,
      fontWeight: 600,
      lineHeight: '24px',
    },
  },
});

/**
 * Brand tokens below — ported from the standalone exchange app's dark-landing
 * design (the "night canvas" treatment), which replaces the orange/blue
 * gradient set the two exports above used to hold. Both call sites
 * (HeroSection, BigCTA) moved to this set at the same time, so there is no
 * lingering reference to the old gradients.
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
