/**
 * Material UI Theme Configuration
 * Maps current design tokens to MUI theme structure
 */
import { createTheme, ThemeOptions } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

export function createAppTheme(mode: ThemeMode) {
  const isLight = mode === 'light';

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: isLight ? '#5940d4' : '#7c5dfa', // Purple gradient
        light: isLight ? '#7c5dfa' : '#9d82ff',
        dark: isLight ? '#3d26be' : '#5940d4',
      },
      secondary: {
        main: isLight ? '#6B7280' : '#9CA3AF',
        light: isLight ? '#9CA3AF' : '#D1D5DB',
        dark: isLight ? '#4B5563' : '#6B7280',
      },
      error: {
        main: isLight ? '#DC2626' : '#fc8181',
        light: isLight ? '#fc8181' : '#feb2b2',
        dark: isLight ? '#B91C1C' : '#f56565',
      },
      warning: {
        main: isLight ? '#F59E0B' : '#f6ad55',
        light: isLight ? '#f6ad55' : '#fbd38d',
        dark: isLight ? '#D97706' : '#ed8936',
      },
      success: {
        main: isLight ? '#10b981' : '#68d391',
        light: isLight ? '#34d399' : '#9ae6b4',
        dark: isLight ? '#059669' : '#48bb78',
      },
      info: {
        main: isLight ? '#3182ce' : '#63b3ed',
        light: isLight ? '#63b3ed' : '#90cdf4',
        dark: isLight ? '#2c5282' : '#4299e1',
      },
      background: {
        default: isLight ? '#F3F4F6' : '#1a202c', // Light gray background
        paper: isLight ? '#FFFFFF' : '#1a202c', // White cards
      },
      text: {
        primary: isLight ? '#111827' : '#f7fafc', // Dark text
        secondary: isLight ? '#6B7280' : '#9CA3AF', // Gray text
        disabled: isLight ? '#9CA3AF' : '#6B7280',
      },
      divider: isLight ? '#E5E7EB' : '#2d3748', // Light border
      action: {
        hover: isLight ? '#f5f3ff' : '#2d3748', // Light purple hover
        selected: isLight ? '#ede9fe' : '#2d3748', // Active purple tint
        disabled: isLight ? '#9CA3AF' : '#6B7280',
        disabledBackground: isLight ? '#F9FAFB' : '#2d3748',
      },
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 16,
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
      h1: {
        fontSize: '1.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h4: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '0.875rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '0.75rem',
        fontWeight: 600,
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
      },
    },
    spacing: 8, // Base unit: 8px (spacing(1) = 8px, spacing(2) = 16px, etc.)
    shape: {
      borderRadius: 12, // Updated to 12px for cards and elements
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 768, // mobile
        md: 1024, // tablet
        lg: 1280, // desktop
        xl: 1536, // wide
      },
    },
    shadows: [
      'none',
      '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // sm
      '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1)', // md
      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)', // lg
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)', // xl
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ],
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
    zIndex: {
      mobileStepper: 1000,
      fab: 1050,
      speedDial: 1050,
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            fontWeight: 500,
            padding: '10px 20px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            marginBottom: 8,
            '&.Mui-selected': {
              background: 'linear-gradient(135deg, #5940d4 0%, #7c5dfa 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #4a35c0 0%, #6b4ce8 100%)',
              },
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            },
            '&:hover': {
              backgroundColor: 'rgba(89, 64, 212, 0.08)',
            },
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
}
