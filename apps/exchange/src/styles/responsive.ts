/**
 * Responsive Design Utilities
 * Media query helpers and responsive patterns for styled-components
 */
import { css, type RuleSet } from 'styled-components';

/**
 * Media query breakpoint helpers
 * Usage: ${media.desktop(css`width: 1200px;`)}
 */
export const media = {
  /**
   * Custom breakpoint helper
   * @param minWidth - Minimum width in pixels
   * @param maxWidth - Optional maximum width in pixels
   */
  custom: (minWidth?: number, maxWidth?: number) => (styles: RuleSet | string) => {
    if (minWidth && maxWidth) {
      return css`
        @media (min-width: ${minWidth}px) and (max-width: ${maxWidth}px) {
          ${styles}
        }
      `;
    } else if (minWidth) {
      return css`
        @media (min-width: ${minWidth}px) {
          ${styles}
        }
      `;
    } else if (maxWidth) {
      return css`
        @media (max-width: ${maxWidth}px) {
          ${styles}
        }
      `;
    }
    return css`
      ${styles}
    `;
  },

  /**
   * Desktop devices (min-width: 1280px)
   */
  desktop: (styles: RuleSet | string) => css`
    @media (min-width: ${(props) => props.theme.breakpoints.desktop}px) {
      ${styles}
    }
  `,

  /**
   * Desktop-only (1024px - 1279px)
   */
  desktopOnly: (styles: RuleSet | string) => css`
    @media (min-width: 1024px) and (max-width: 1279px) {
      ${styles}
    }
  `,
  /**
   * Mobile devices (max-width: 768px)
   */
  mobile: (styles: RuleSet | string) => css`
    @media (max-width: ${(props) => props.theme.breakpoints.mobile}px) {
      ${styles}
    }
  `,

  /**
   * Mobile-only (max-width: 767px)
   */
  mobileOnly: (styles: RuleSet | string) => css`
    @media (max-width: 767px) {
      ${styles}
    }
  `,

  /**
   * Not desktop (max-width: 1279px)
   */
  notDesktop: (styles: RuleSet | string) => css`
    @media (max-width: 1279px) {
      ${styles}
    }
  `,

  /**
   * Not mobile (min-width: 768px)
   */
  notMobile: (styles: RuleSet | string) => css`
    @media (min-width: 768px) {
      ${styles}
    }
  `,

  /**
   * Tablet devices (max-width: 1024px)
   */
  tablet: (styles: RuleSet | string) => css`
    @media (max-width: ${(props) => props.theme.breakpoints.tablet}px) {
      ${styles}
    }
  `,

  /**
   * Tablet-only (768px - 1023px)
   */
  tabletOnly: (styles: RuleSet | string) => css`
    @media (min-width: 768px) and (max-width: 1023px) {
      ${styles}
    }
  `,

  /**
   * Wide screens (min-width: 1536px)
   */
  wide: (styles: RuleSet | string) => css`
    @media (min-width: ${(props) => props.theme.breakpoints.wide}px) {
      ${styles}
    }
  `,
};

/**
 * Orientation-based media queries
 */
export const orientation = {
  landscape: (styles: RuleSet | string) => css`
    @media (orientation: landscape) {
      ${styles}
    }
  `,
  portrait: (styles: RuleSet | string) => css`
    @media (orientation: portrait) {
      ${styles}
    }
  `,
};

/**
 * Reduced motion media query (accessibility)
 */
export const reducedMotion = (styles: RuleSet | string) => css`
  @media (prefers-reduced-motion: reduce) {
    ${styles}
  }
`;

/**
 * Dark mode media query
 */
export const prefersDark = (styles: RuleSet | string) => css`
  @media (prefers-color-scheme: dark) {
    ${styles}
  }
`;

/**
 * Light mode media query
 */
export const prefersLight = (styles: RuleSet | string) => css`
  @media (prefers-color-scheme: light) {
    ${styles}
  }
`;

/**
 * High contrast mode (accessibility)
 */
export const highContrast = (styles: RuleSet | string) => css`
  @media (prefers-contrast: high) {
    ${styles}
  }
`;

/**
 * Retina/HiDPI displays
 */
export const retina = (styles: RuleSet | string) => css`
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    ${styles}
  }
`;

/**
 * Responsive font size helper
 * Scales between min and max based on viewport width
 */
export const fluidFontSize = (min: number, max: number) => css`
  font-size: clamp(${min}px, ${(min + max) / 2}vw, ${max}px);
`;

/**
 * Responsive spacing helper
 * Scales spacing based on viewport width
 */
export const fluidSpacing = (min: number, max: number) => css`
  padding: clamp(${min}px, ${(min + max) / 2}vw, ${max}px);
`;

/**
 * Container query helper (experimental)
 * Requires container-type: inline-size on parent
 */
export const container = {
  query: (minWidth: number) => (styles: RuleSet | string) =>
    css`
    @container (min-width: ${minWidth}px) {
      ${styles}
    }
  `,
};

/**
 * Responsive grid helper
 * Creates responsive grid with auto-fit columns
 */
export const responsiveGrid = (minColumnWidth: number = 250) => css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${minColumnWidth}px, 1fr));
  gap: ${(props) => props.theme.spacing.md};
`;

/**
 * Show/hide utilities for different breakpoints
 */
export const show = {
  desktop: css`
    display: none;
    ${media.desktop(css`
      display: block;
    `)}
  `,
  mobile: css`
    display: none;
    ${media.mobile(css`
      display: block;
    `)}
  `,
  tablet: css`
    display: none;
    ${media.tablet(css`
      display: block;
    `)}
  `,
};

export const hide = {
  desktop: css`
    ${media.desktop(css`
      display: none;
    `)}
  `,
  mobile: css`
    ${media.mobile(css`
      display: none;
    `)}
  `,
  tablet: css`
    ${media.tablet(css`
      display: none;
    `)}
  `,
};
