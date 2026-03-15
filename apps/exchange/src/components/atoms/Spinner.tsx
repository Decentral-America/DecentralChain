/**
 * Spinner Component
 * Animated loading indicator
 * Migrated to Material-UI CircularProgress
 */

import Box from '@mui/material/Box';
import CircularProgress, {
  type CircularProgressProps as MuiCircularProgressProps,
} from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import type React from 'react';

export interface SpinnerProps extends Omit<MuiCircularProgressProps, 'size' | 'color'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  thickness?: number;
  label?: string;
}

const sizeMap = {
  lg: 48,
  md: 32,
  sm: 16,
  xl: 64,
  xs: 12,
};

const SpinnerContainer = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  display: 'inline-flex',
  gap: theme.spacing(1),
}));

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color,
  thickness = 3.6,
  label,
  ...props
}) => {
  const circularSize = sizeMap[size];

  return (
    <SpinnerContainer>
      <CircularProgress size={circularSize} thickness={thickness} sx={{ color }} {...props} />
      {label && <Typography variant="body2">{label}</Typography>}
    </SpinnerContainer>
  );
};

Spinner.displayName = 'Spinner';
