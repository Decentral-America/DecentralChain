import { createTheme } from '@mui/material/styles';

/**
 * Landing page theme following the design spec
 * Global theme & tokens with Inter font, custom color palette, and spacing
 */
export const landingTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3d26be', // Deep purple/indigo
      dark: '#2d1c8f',
      light: '#5940d4',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#06B6D4', // Cyan for contrast
      dark: '#0891B2',
      light: '#22D3EE',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444',
    },
    success: {
      main: '#10B981', // Emerald for success states
    },
    warning: {
      main: '#F59E0B', // amber-500 (accent)
    },
    text: {
      primary: '#111827', // gray-900
      secondary: '#667085', // gray-500
    },
    divider: '#EEF2F7',
    background: {
      default: '#F9FAFB', // gray-50
      paper: '#FFFFFF',
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
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '56px',
      lineHeight: 1.1,
      fontWeight: 700,
      letterSpacing: '-0.5px',
      '@media (max-width:1200px)': {
        fontSize: '48px',
      },
      '@media (max-width:900px)': {
        fontSize: '40px',
        lineHeight: 1.2,
      },
    },
    h2: {
      fontSize: '36px',
      lineHeight: '44px',
      fontWeight: 700,
      letterSpacing: '-0.3px',
      '@media (max-width:1200px)': {
        fontSize: '32px',
        lineHeight: '40px',
      },
      '@media (max-width:900px)': {
        fontSize: '28px',
        lineHeight: '36px',
      },
    },
    h3: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 600,
      '@media (max-width:1200px)': {
        fontSize: '22px',
        lineHeight: '30px',
      },
      '@media (max-width:900px)': {
        fontSize: '20px',
        lineHeight: '28px',
      },
    },
    h4: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 500,
    },
    h5: {
      fontSize: '18px',
      lineHeight: '26px',
      fontWeight: 500,
    },
    h6: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: 16,
      fontWeight: 600,
      lineHeight: '24px',
    },
    body1: {
      fontSize: '16px',
      lineHeight: '26px',
      fontWeight: 400,
    },
    body2: {
      fontSize: '14px',
      lineHeight: '22px',
      fontWeight: 400,
    },
    caption: {
      fontSize: '12px',
      lineHeight: '18px',
      fontWeight: 400,
    },
    overline: {
      fontSize: '12px',
      lineHeight: '18px',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
    },
  },
  shape: {
    borderRadius: 14, // Default card radius
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
  spacing: 8, // 8px base
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '10px',
        },
        containedPrimary: {
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35)',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          border: '1px solid #E6EAF2',
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
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '24px',
          paddingRight: '24px',
          '@media (max-width:900px)': {
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        },
      },
    },
  },
});

// Hero gradient background (reusable)
export const heroGradientStyles = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: `
    radial-gradient(1200px 600px at 20% -10%, #FF7A59 0%, rgba(255,122,89,0) 60%),
    radial-gradient(900px 500px at 70% 0%, #5B8CFF 0%, rgba(91,140,255,0) 60%),
    radial-gradient(800px 400px at 40% 30%, #9D4EDD 0%, rgba(157,78,221,0) 60%),
    linear-gradient(180deg, #0A0E1A 0%, #111827 100%)
  `,
  filter: 'saturate(1.05)',
  zIndex: 0,
};

// Lighter gradient for CTA banner
export const ctaGradientStyles = {
  background: `
    radial-gradient(1200px 600px at 20% -10%, rgba(255,122,89,0.7) 0%, rgba(255,122,89,0) 60%),
    radial-gradient(900px 500px at 70% 0%, rgba(91,140,255,0.7) 0%, rgba(91,140,255,0) 60%),
    radial-gradient(800px 400px at 40% 30%, rgba(157,78,221,0.7) 0%, rgba(157,78,221,0) 60%),
    linear-gradient(180deg, rgba(10,14,26,0.8) 0%, rgba(17,24,39,0.9) 100%)
  `,
};
