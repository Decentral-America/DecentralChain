/**
 * Material UI Theme Configuration
 * Maps current design tokens to MUI theme structure
 */
import { createTheme, type ThemeOptions } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

const PALETTES: Record<ThemeMode, Omit<NonNullable<ThemeOptions['palette']>, 'mode'>> = {
  dark: {
    action: {
      disabled: '#6B7280',
      disabledBackground: '#2d3748',
      hover: '#2d3748',
      selected: '#2d3748',
    },
    background: { default: '#1a202c', paper: '#1a202c' },
    divider: '#2d3748',
    error: { dark: '#f56565', light: '#feb2b2', main: '#fc8181' },
    info: { dark: '#4299e1', light: '#90cdf4', main: '#63b3ed' },
    primary: { dark: '#5940d4', light: '#9d82ff', main: '#7c5dfa' },
    secondary: { dark: '#6B7280', light: '#D1D5DB', main: '#9CA3AF' },
    success: { dark: '#48bb78', light: '#9ae6b4', main: '#68d391' },
    text: { disabled: '#6B7280', primary: '#f7fafc', secondary: '#9CA3AF' },
    warning: { dark: '#ed8936', light: '#fbd38d', main: '#f6ad55' },
  },
  light: {
    action: {
      disabled: '#9CA3AF',
      disabledBackground: '#F9FAFB',
      hover: '#f5f3ff',
      selected: '#ede9fe',
    },
    background: { default: '#F3F4F6', paper: '#FFFFFF' },
    divider: '#E5E7EB',
    error: { dark: '#B91C1C', light: '#fc8181', main: '#DC2626' },
    info: { dark: '#2c5282', light: '#63b3ed', main: '#3182ce' },
    primary: { dark: '#3d26be', light: '#7c5dfa', main: '#5940d4' },
    secondary: { dark: '#4B5563', light: '#9CA3AF', main: '#6B7280' },
    success: { dark: '#059669', light: '#34d399', main: '#10b981' },
    text: { disabled: '#9CA3AF', primary: '#111827', secondary: '#6B7280' },
    warning: { dark: '#D97706', light: '#f6ad55', main: '#F59E0B' },
  },
};

function createComponentOverrides(): ThemeOptions['components'] {
  return {
    MuiButton: {
      styleOverrides: {
        contained: { '&:hover': { boxShadow: 'none' }, boxShadow: 'none' },
        root: { borderRadius: 12, fontWeight: 500, padding: '10px 20px', textTransform: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: { root: { borderRadius: 12, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' } },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 16 } } },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: 'rgba(89, 64, 212, 0.08)' },
          '&.Mui-selected': {
            '& .MuiListItemIcon-root': { color: 'white' },
            '&:hover': { background: 'linear-gradient(135deg, #4a35c0 0%, #6b4ce8 100%)' },
            background: 'linear-gradient(135deg, #5940d4 0%, #7c5dfa 100%)',
            color: 'white',
          },
          borderRadius: 10,
          marginBottom: 8,
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
    MuiTextField: {
      styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 10 } } },
    },
  };
}

export function createAppTheme(mode: ThemeMode) {
  const themeOptions: ThemeOptions = {
    breakpoints: {
      values: { lg: 1280, md: 1024, sm: 768, xl: 1536, xs: 0 },
    },
    components: createComponentOverrides(),
    palette: { mode, ...PALETTES[mode] },
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
    shape: {
      borderRadius: 12, // Updated to 12px for cards and elements
    },
    spacing: 8, // Base unit: 8px (spacing(1) = 8px, spacing(2) = 16px, etc.)
    transitions: {
      duration: {
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
        short: 250,
        shorter: 200,
        shortest: 150,
        standard: 300,
      },
      easing: {
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
    typography: {
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
      button: {
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none',
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: 1.5,
      },
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 16,
      fontWeightBold: 700,
      fontWeightLight: 300,
      fontWeightMedium: 500,
      fontWeightRegular: 400,
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
    },
    zIndex: {
      appBar: 1100,
      drawer: 1200,
      fab: 1050,
      mobileStepper: 1000,
      modal: 1300,
      snackbar: 1400,
      speedDial: 1050,
      tooltip: 1500,
    },
  };

  return createTheme(themeOptions);
}
