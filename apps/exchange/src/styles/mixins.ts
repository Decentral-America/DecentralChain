/**
 * Styled Components Utility Mixins
 * Reusable CSS patterns to replace LESS mixins
 */
import { css } from 'styled-components';

/**
 * Flexbox center alignment (both axes)
 */
export const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * Flexbox column layout
 */
export const flexColumn = css`
  display: flex;
  flex-direction: column;
`;

/**
 * Flexbox row with vertical center alignment
 */
export const flexRow = css`
  display: flex;
  align-items: center;
`;

/**
 * Flexbox space-between alignment
 */
export const flexBetween = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

/**
 * Text truncation with ellipsis
 */
export const truncate = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * Multi-line text truncation
 * @param lines - Number of lines to show before truncating
 */
export const lineClamp = (lines: number) => css`
  display: -webkit-box;
  -webkit-line-clamp: ${lines};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/**
 * Hide scrollbar (all browsers)
 */
export const hideScrollbar = css`
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

/**
 * Custom scrollbar styling
 */
export const customScrollbar = css`
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${(props) => props.theme.colors.background};
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.colors.border};
    border-radius: ${(props) => props.theme.radii.sm};

    &:hover {
      background: ${(props) => props.theme.colors.primary}40;
    }
  }
`;

/**
 * Absolute positioning that fills parent
 */
export const absoluteFill = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

/**
 * Fixed positioning that fills viewport
 */
export const fixedFill = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

/**
 * Responsive container with max-width
 */
export const container = css`
  width: 100%;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: ${(props) => props.theme.spacing.md};
  padding-right: ${(props) => props.theme.spacing.md};
`;

/**
 * Reset button styles
 */
export const resetButton = css`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  outline: none;
`;

/**
 * Reset list styles
 */
export const resetList = css`
  list-style: none;
  padding: 0;
  margin: 0;
`;

/**
 * Visually hidden (accessible to screen readers)
 */
export const visuallyHidden = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`;

/**
 * Focus ring styles (accessibility)
 */
export const focusRing = css`
  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.colors.primary};
    outline-offset: 2px;
  }
`;

/**
 * Smooth transitions
 */
export const transition = (property = 'all') => css`
  transition: ${property} ${(props) => props.theme.transitions.fast};
`;

/**
 * Hover lift effect
 */
export const hoverLift = css`
  transition: ${(props) => props.theme.transitions.medium};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(props) => props.theme.shadows.md};
  }
`;

/**
 * Glass morphism effect
 */
export const glassMorphism = css`
  background: ${(props) => props.theme.colors.background}80;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid ${(props) => props.theme.colors.border}40;
`;

/**
 * Card elevation styles
 */
export const cardElevation = css`
  background: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.radii.md};
  box-shadow: ${(props) => props.theme.shadows.sm};
  transition: ${(props) => props.theme.transitions.fast};

  &:hover {
    box-shadow: ${(props) => props.theme.shadows.md};
  }
`;

/**
 * Gradient text effect
 */
export const gradientText = css`
  background: linear-gradient(
    135deg,
    ${(props) => props.theme.colors.primary},
    ${(props) => props.theme.colors.secondary}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

/**
 * Skeleton loading animation
 */
export const skeletonLoading = css`
  background: linear-gradient(
    90deg,
    ${(props) => props.theme.colors.border} 25%,
    ${(props) => props.theme.colors.background} 50%,
    ${(props) => props.theme.colors.border} 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;
