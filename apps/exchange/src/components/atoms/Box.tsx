/**
 * Box Component
 * Fundamental layout primitive with spacing, sizing, and styling controls
 */
import styled from 'styled-components';

export interface BoxProps {
  // Spacing
  p?: string; // padding
  pt?: string; // padding-top
  pr?: string; // padding-right
  pb?: string; // padding-bottom
  pl?: string; // padding-left
  px?: string; // padding-left & padding-right
  py?: string; // padding-top & padding-bottom
  m?: string; // margin
  mt?: string; // margin-top
  mr?: string; // margin-right
  mb?: string; // margin-bottom
  ml?: string; // margin-left
  mx?: string; // margin-left & margin-right
  my?: string; // margin-top & margin-bottom

  // Sizing
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;

  // Background & Border
  bg?: string; // background color
  color?: string; // text color
  border?: string;
  borderRadius?: string;

  // Display & Position
  display?: 'block' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'none';
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number;

  // Flexbox (when display is flex)
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: string;

  // Overflow
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  overflowX?: 'visible' | 'hidden' | 'scroll' | 'auto';
  overflowY?: 'visible' | 'hidden' | 'scroll' | 'auto';

  // Cursor
  cursor?: 'pointer' | 'default' | 'not-allowed' | 'text' | 'move' | 'grab';

  // Pointer events
  pointerEvents?: 'auto' | 'none';

  // Box shadow
  boxShadow?: string;

  // Transition
  transition?: string;

  // Transform
  transform?: string;

  // Opacity
  opacity?: number;
}

export const Box = styled.div<BoxProps>`
  /* Spacing */
  ${(props) => props.p && `padding: ${props.p};`}
  ${(props) => props.pt && `padding-top: ${props.pt};`}
  ${(props) => props.pr && `padding-right: ${props.pr};`}
  ${(props) => props.pb && `padding-bottom: ${props.pb};`}
  ${(props) => props.pl && `padding-left: ${props.pl};`}
  ${(props) => props.px && `padding-left: ${props.px}; padding-right: ${props.px};`}
  ${(props) => props.py && `padding-top: ${props.py}; padding-bottom: ${props.py};`}
  
  ${(props) => props.m && `margin: ${props.m};`}
  ${(props) => props.mt && `margin-top: ${props.mt};`}
  ${(props) => props.mr && `margin-right: ${props.mr};`}
  ${(props) => props.mb && `margin-bottom: ${props.mb};`}
  ${(props) => props.ml && `margin-left: ${props.ml};`}
  ${(props) => props.mx && `margin-left: ${props.mx}; margin-right: ${props.mx};`}
  ${(props) => props.my && `margin-top: ${props.my}; margin-bottom: ${props.my};`}

  /* Sizing */
  ${(props) => props.width && `width: ${props.width};`}
  ${(props) => props.height && `height: ${props.height};`}
  ${(props) => props.minWidth && `min-width: ${props.minWidth};`}
  ${(props) => props.maxWidth && `max-width: ${props.maxWidth};`}
  ${(props) => props.minHeight && `min-height: ${props.minHeight};`}
  ${(props) => props.maxHeight && `max-height: ${props.maxHeight};`}

  /* Background & Border */
  ${(props) => props.bg && `background: ${props.bg};`}
  ${(props) => props.color && `color: ${props.color};`}
  ${(props) => props.border && `border: ${props.border};`}
  ${(props) => props.borderRadius && `border-radius: ${props.borderRadius};`}

  /* Display & Position */
  ${(props) => props.display && `display: ${props.display};`}
  ${(props) => props.position && `position: ${props.position};`}
  ${(props) => props.top && `top: ${props.top};`}
  ${(props) => props.right && `right: ${props.right};`}
  ${(props) => props.bottom && `bottom: ${props.bottom};`}
  ${(props) => props.left && `left: ${props.left};`}
  ${(props) => props.zIndex !== undefined && `z-index: ${props.zIndex};`}

  /* Flexbox */
  ${(props) => props.justifyContent && `justify-content: ${props.justifyContent};`}
  ${(props) => props.alignItems && `align-items: ${props.alignItems};`}
  ${(props) => props.flexDirection && `flex-direction: ${props.flexDirection};`}
  ${(props) => props.flexWrap && `flex-wrap: ${props.flexWrap};`}
  ${(props) => props.gap && `gap: ${props.gap};`}

  /* Overflow */
  ${(props) => props.overflow && `overflow: ${props.overflow};`}
  ${(props) => props.overflowX && `overflow-x: ${props.overflowX};`}
  ${(props) => props.overflowY && `overflow-y: ${props.overflowY};`}

  /* Cursor */
  ${(props) => props.cursor && `cursor: ${props.cursor};`}

  /* Pointer events */
  ${(props) => props.pointerEvents && `pointer-events: ${props.pointerEvents};`}

  /* Box shadow */
  ${(props) => props.boxShadow && `box-shadow: ${props.boxShadow};`}

  /* Transition */
  ${(props) => props.transition && `transition: ${props.transition};`}

  /* Transform */
  ${(props) => props.transform && `transform: ${props.transform};`}

  /* Opacity */
  ${(props) => props.opacity !== undefined && `opacity: ${props.opacity};`}
`;
