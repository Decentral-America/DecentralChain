/**
 * Divider Component
 * Visual separator for content sections
 */
import styled from 'styled-components';
import React from 'react';

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  spacing?: string;
  thickness?: string;
  variant?: 'solid' | 'dashed' | 'dotted';
  label?: string;
}

const DividerLine = styled.hr<{
  orientation: 'horizontal' | 'vertical';
  spacing?: string;
  thickness: string;
  variant: string;
  hasLabel: boolean;
}>`
  border: none;
  margin: 0;
  flex-shrink: 0;

  ${(p) =>
    p.orientation === 'horizontal'
      ? `
    width: ${p.hasLabel ? 'auto' : '100%'};
    height: 0;
    border-top: ${p.thickness} ${p.variant} ${p.theme.colors.border};
    margin: ${p.spacing || p.theme.spacing.md} 0;
  `
      : `
    width: 0;
    height: 100%;
    border-left: ${p.thickness} ${p.variant} ${p.theme.colors.border};
    margin: 0 ${p.spacing || p.theme.spacing.md};
  `}
`;

const DividerContainer = styled.div<{
  orientation: 'horizontal' | 'vertical';
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(p) => (p.orientation === 'horizontal' ? '100%' : 'auto')};
  height: ${(p) => (p.orientation === 'vertical' ? '100%' : 'auto')};
  flex-direction: ${(p) => (p.orientation === 'horizontal' ? 'row' : 'column')};
  gap: ${(p) => p.theme.spacing.sm};
`;

const DividerLabel = styled.span`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.6;
  white-space: nowrap;
  flex-shrink: 0;
`;

export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  (
    { orientation = 'horizontal', spacing, thickness = '1px', variant = 'solid', label, ...props },
    ref
  ) => {
    if (label) {
      return (
        <DividerContainer orientation={orientation}>
          <DividerLine
            ref={ref}
            orientation={orientation}
            spacing={spacing}
            thickness={thickness}
            variant={variant}
            hasLabel={true}
            {...props}
          />
          <DividerLabel>{label}</DividerLabel>
          <DividerLine
            orientation={orientation}
            spacing={spacing}
            thickness={thickness}
            variant={variant}
            hasLabel={true}
          />
        </DividerContainer>
      );
    }

    return (
      <DividerLine
        ref={ref}
        orientation={orientation}
        spacing={spacing}
        thickness={thickness}
        variant={variant}
        hasLabel={false}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';
