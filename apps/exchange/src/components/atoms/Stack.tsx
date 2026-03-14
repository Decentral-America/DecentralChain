/**
 * Stack Component
 * Layout primitive for vertical or horizontal stacking with consistent gaps
 * Migrated to Material-UI Stack
 */
import MuiStack, { StackProps as MuiStackProps } from '@mui/material/Stack';
import { styled } from '@mui/material/styles';

export interface StackProps extends Omit<MuiStackProps, 'gap'> {
  gap?: string | number;
  inline?: boolean;
}

export const Stack = styled(MuiStack, {
  shouldForwardProp: (prop) => prop !== 'inline',
})<StackProps>(({ inline }) => ({
  display: inline ? 'inline-flex' : 'flex',
}));

/**
 * HStack - Horizontal Stack
 * Convenience component for horizontal stacking
 */
export const HStack = styled(Stack)({
  flexDirection: 'row',
});

/**
 * VStack - Vertical Stack
 * Convenience component for vertical stacking
 */
export const VStack = styled(Stack)({
  flexDirection: 'column',
});

/**
 * Spacer - Flexible space component
 * Grows to fill available space in a Stack
 */
export const Spacer = styled('div')({
  flex: 1,
});
