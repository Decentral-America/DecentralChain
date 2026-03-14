/**
 * Tooltip Component
 * Contextual information on hover
 * Migrated to Material-UI Tooltip
 */
import { ReactNode } from 'react';
import MuiTooltip, { TooltipProps as MuiTooltipProps } from '@mui/material/Tooltip';

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
            maxWidth: maxWidth,
            fontSize: '0.75rem',
          },
        },
      }}
      {...props}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>{children}</span>
    </MuiTooltip>
  );
};

Tooltip.displayName = 'Tooltip';
