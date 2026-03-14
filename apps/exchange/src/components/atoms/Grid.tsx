/**
 * Grid Component
 * Layout primitive for CSS Grid layouts with flexible configurations
 */
import styled from 'styled-components';

export interface GridProps {
  columns?: number | string; // number for repeat, string for custom template
  rows?: number | string; // number for repeat, string for custom template
  gap?: string;
  columnGap?: string;
  rowGap?: string;
  autoRows?: string;
  autoColumns?: string;
  autoFlow?: 'row' | 'column' | 'row dense' | 'column dense';
  templateAreas?: string;
  alignItems?: 'start' | 'end' | 'center' | 'stretch';
  justifyItems?: 'start' | 'end' | 'center' | 'stretch';
  alignContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around';
  justifyContent?: 'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around';
  inline?: boolean;
}

export const Grid = styled.div.withConfig({
  shouldForwardProp: (prop) =>
    ![
      'columns',
      'rows',
      'gap',
      'columnGap',
      'rowGap',
      'autoRows',
      'autoColumns',
      'autoFlow',
      'templateAreas',
      'alignItems',
      'justifyItems',
      'alignContent',
      'justifyContent',
      'inline',
    ].includes(prop as string),
})<GridProps>`
  display: ${(props) => (props.inline ? 'inline-grid' : 'grid')};

  /* Grid Template */
  grid-template-columns: ${(props) => {
    if (!props.columns) return '1fr';
    if (typeof props.columns === 'number') return `repeat(${props.columns}, 1fr)`;
    return props.columns;
  }};

  ${(props) => {
    if (!props.rows) return '';
    if (typeof props.rows === 'number') return `grid-template-rows: repeat(${props.rows}, 1fr);`;
    return `grid-template-rows: ${props.rows};`;
  }}

  /* Gap */
  ${(props) => props.gap && `gap: ${props.gap};`}
  ${(props) => props.columnGap && `column-gap: ${props.columnGap};`}
  ${(props) => props.rowGap && `row-gap: ${props.rowGap};`}

  /* Auto sizing */
  ${(props) => props.autoRows && `grid-auto-rows: ${props.autoRows};`}
  ${(props) => props.autoColumns && `grid-auto-columns: ${props.autoColumns};`}
  ${(props) => props.autoFlow && `grid-auto-flow: ${props.autoFlow};`}

  /* Template areas */
  ${(props) => props.templateAreas && `grid-template-areas: ${props.templateAreas};`}

  /* Alignment */
  ${(props) => props.alignItems && `align-items: ${props.alignItems};`}
  ${(props) => props.justifyItems && `justify-items: ${props.justifyItems};`}
  ${(props) => props.alignContent && `align-content: ${props.alignContent};`}
  ${(props) => props.justifyContent && `justify-content: ${props.justifyContent};`}
`;

/**
 * GridItem Component
 * Child component for Grid with span and placement properties
 */
export interface GridItemProps {
  colSpan?: number;
  rowSpan?: number;
  colStart?: number;
  colEnd?: number;
  rowStart?: number;
  rowEnd?: number;
  area?: string;
  justifySelf?: 'start' | 'end' | 'center' | 'stretch';
  alignSelf?: 'start' | 'end' | 'center' | 'stretch';
}

export const GridItem = styled.div<GridItemProps>`
  ${(props) => props.colSpan && `grid-column: span ${props.colSpan};`}
  ${(props) => props.rowSpan && `grid-row: span ${props.rowSpan};`}
  ${(props) => props.colStart && `grid-column-start: ${props.colStart};`}
  ${(props) => props.colEnd && `grid-column-end: ${props.colEnd};`}
  ${(props) => props.rowStart && `grid-row-start: ${props.rowStart};`}
  ${(props) => props.rowEnd && `grid-row-end: ${props.rowEnd};`}
  ${(props) => props.area && `grid-area: ${props.area};`}
  ${(props) => props.justifySelf && `justify-self: ${props.justifySelf};`}
  ${(props) => props.alignSelf && `align-self: ${props.alignSelf};`}
`;
