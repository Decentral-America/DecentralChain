/**
 * Tooltip Component
 * Contextual information on hover
 * Migrated to Material-UI Tooltip
 */

import MuiTooltip, { type TooltipProps as MuiTooltipProps } from '@mui/material/Tooltip';
import { type ReactNode } from 'react';

export interface TooltipProps
  extends Omit<MuiTooltipProps, 'title' | 'placement' | 'children' | 'content'> {
  content: NonNullable<React.ReactNode>;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: string;
}

export const Tooltip = ({
  content,
  children,
  position = 'top',
  delay = 200,
  maxWidth = '200px',
  ...props
}: TooltipProps) => {
  return (
    <MuiTooltip
      title={content}
      placement={position}
      enterDelay={delay}
      slotProps={{
        tooltip: {
          sx: {
            fontSize: '0.75rem',
            maxWidth: maxWidth,
          },
        },
      }}
      {...props}
    >
      <span style={{ alignItems: 'center', display: 'inline-flex' }}>{children}</span>
    </MuiTooltip>
  );
};

Tooltip.displayName = 'Tooltip';
