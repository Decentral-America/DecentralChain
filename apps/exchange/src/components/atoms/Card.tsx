/**
 * Card Component
 * Container component with elevation (shadows) and padding
 * Fundamental building block for content organization
 * Migrated to Material-UI
 */
import React from 'react';
import MuiCard, { CardProps as MuiCardProps } from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

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
    padding: padding || theme.spacing(3),
    border: bordered ? `1px solid ${theme.palette.divider}` : undefined,
    boxShadow: bordered ? 'none' : undefined,
    transition: theme.transitions.create(['transform', 'box-shadow'], {
      duration: theme.transitions.duration.short,
    }),
    [theme.breakpoints.down('sm')]: {
      padding: padding || theme.spacing(1.5),
    },
    ...(hoverable && {
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[8],
      },
      '&:active': {
        transform: 'translateY(0)',
        boxShadow: theme.shadows[4],
      },
    }),
  })
);

/**
 * Card compound components for structured layouts
 */
export { CardHeader, CardContent as CardBody, CardActions as CardFooter };

export const CardTitle = styled(Typography)(({ theme }) => ({
  margin: 0,
  fontSize: theme.typography.h6.fontSize,
  fontWeight: theme.typography.fontWeightMedium,
  color: theme.palette.text.primary,
}));

export const CardDescription = styled(Typography)(({ theme }) => ({
  margin: `${theme.spacing(0.5)} 0 0 0`,
  fontSize: theme.typography.body2.fontSize,
  color: theme.palette.text.secondary,
  lineHeight: 1.5,
}));

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ elevation = 'md', ...props }, ref) => {
    const muiElevation = getElevation(elevation);
    return <StyledCard ref={ref} elevation={muiElevation} {...props} />;
  }
);

Card.displayName = 'Card';
