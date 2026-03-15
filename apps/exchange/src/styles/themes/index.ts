/**
 * Theme definitions for light and dark modes
 * Full theme properties will be defined in Phase 4
 */
import { type DefaultTheme } from 'styled-components';

export const lightTheme: DefaultTheme = {
  breakpoints: {
    desktop: '1280px',
    mobile: '768px',
    tablet: '1024px',
    wide: '1536px',
  },
  colors: {
    background: '#ffffff',
    border: '#e2e8f0',
    disabled: '#a0aec0',
    error: '#e53e3e',
    hover: '#f7fafc',
    info: '#3182ce',
    primary: '#1f5af6',
    secondary: '#5a81ff',
    success: '#38a169',
    text: '#1a202c',
    warning: '#dd6b20',
  },
  fontSizes: {
    lg: '1.125rem',
    md: '1rem',
    sm: '0.875rem',
    xl: '1.25rem',
    xs: '0.75rem',
    xxl: '1.5rem',
  },
  fonts: {
    main: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
  },
  fontWeights: {
    bold: 700,
    light: 300,
    medium: 500,
    regular: 400,
    semibold: 600,
  },
  radii: {
    full: '9999px',
    lg: '12px',
    md: '8px',
    sm: '4px',
  },
  shadows: {
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    lg: '1.5rem',
    md: '1rem',
    sm: '0.5rem',
    xl: '2rem',
    xs: '0.25rem',
    xxl: '3rem',
  },
  transitions: {
    fast: 'all 0.15s ease',
    medium: 'all 0.3s ease',
    slow: 'all 0.5s ease',
  },
  zIndices: {
    dropdown: 1000,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    sticky: 1100,
    toast: 1500,
  },
};

export const darkTheme: DefaultTheme = {
  breakpoints: {
    desktop: '1280px',
    mobile: '768px',
    tablet: '1024px',
    wide: '1536px',
  },
  colors: {
    background: '#1a202c',
    border: '#2d3748',
    disabled: '#4a5568',
    error: '#fc8181',
    hover: '#2d3748',
    info: '#63b3ed',
    primary: '#5a81ff',
    secondary: '#7c9eff',
    success: '#68d391',
    text: '#f7fafc',
    warning: '#f6ad55',
  },
  fontSizes: {
    lg: '1.125rem',
    md: '1rem',
    sm: '0.875rem',
    xl: '1.25rem',
    xs: '0.75rem',
    xxl: '1.5rem',
  },
  fonts: {
    main: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
  },
  fontWeights: {
    bold: 700,
    light: 300,
    medium: 500,
    regular: 400,
    semibold: 600,
  },
  radii: {
    full: '9999px',
    lg: '12px',
    md: '8px',
    sm: '4px',
  },
  shadows: {
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
  },
  spacing: {
    lg: '1.5rem',
    md: '1rem',
    sm: '0.5rem',
    xl: '2rem',
    xs: '0.25rem',
    xxl: '3rem',
  },
  transitions: {
    fast: 'all 0.15s ease',
    medium: 'all 0.3s ease',
    slow: 'all 0.5s ease',
  },
  zIndices: {
    dropdown: 1000,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    sticky: 1100,
    toast: 1500,
  },
};
