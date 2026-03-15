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
