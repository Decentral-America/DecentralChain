/**
 * Card Component
 * Container component with elevation (shadows) and padding
 * Fundamental building block for content organization
 * Migrated to Material-UI
 */

import MuiCard, { type CardProps as MuiCardProps } from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React from 'react';

export interface CardProps extends Omit<MuiCardProps, 'elevation'> {
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  padding?: string;
  hoverable?: boolean;
  bordered?: boolean;
  as?: React.ElementType;
}

/**
 * Map custom elevation to MUI elevation (0-24)
 */
const getElevation = (elevation?: string): number => {
  switch (elevation) {
    case 'none':
      return 0;
    case 'sm':
      return 1;
    case 'md':
      return 4;
    case 'lg':
      return 8;
    default:
      return 4;
  }
};

const StyledCard = styled(MuiCard, {
  shouldForwardProp: (prop) => !['hoverable', 'bordered', 'padding'].includes(prop as string),
})<{ hoverable?: boolean; bordered?: boolean; padding?: string }>(
  ({ theme, hoverable, bordered, padding }) => ({
    border: bordered ? `1px solid ${theme.palette.divider}` : undefined,
    boxShadow: bordered ? 'none' : undefined,
    padding: padding || theme.spacing(3),
    transition: theme.transitions.create(['transform', 'box-shadow'], {
      duration: theme.transitions.duration.short,
    }),
    [theme.breakpoints.down('sm')]: {
      padding: padding || theme.spacing(1.5),
    },
    ...(hoverable && {
      '&:active': {
        boxShadow: theme.shadows[4],
        transform: 'translateY(0)',
      },
      '&:hover': {
        boxShadow: theme.shadows[8],
        transform: 'translateY(-2px)',
      },
      cursor: 'pointer',
    }),
  }),
);

/**
 * Card compound components for structured layouts
 */
export { CardActions as CardFooter, CardContent as CardBody, CardHeader };

export const CardTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: theme.typography.h6.fontSize,
  fontWeight: theme.typography.fontWeightMedium,
  margin: 0,
}));

export const CardDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: 1.5,
  margin: `${theme.spacing(0.5)} 0 0 0`,
}));

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ elevation = 'md', ...props }, ref) => {
    const muiElevation = getElevation(elevation);
    return (
      <StyledCard ref={ref} elevation={muiElevation} {...(props as Record<string, unknown>)} />
    );
  },
);

Card.displayName = 'Card';
