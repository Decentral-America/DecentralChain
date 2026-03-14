/**
 * Spinner Component
 * Animated loading indicator
 * Migrated to Material-UI CircularProgress
 */
import React from 'react';
import CircularProgress, {
  CircularProgressProps as MuiCircularProgressProps,
} from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

export interface SpinnerProps extends Omit<MuiCircularProgressProps, 'size' | 'color'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  thickness?: number;
  label?: string;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 32,
  lg: 48,
  xl: 64,
};

const SpinnerContainer = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
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
