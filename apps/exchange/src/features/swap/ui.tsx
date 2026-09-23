/**
 * The swap surface's shared parts.
 *
 * Four shapes recur across every tab — a card, an amount well, a token pill,
 * and the primary action. Defining them once is what makes the six tabs read
 * as one product rather than six screens that happen to share a nav.
 *
 * Colour comes from the theme palette rather than literals, so the gradient
 * and the wells track light and dark without a second set of values.
 */
import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, Button, Paper, Stack, Typography, useTheme } from '@mui/material';
import { type ReactNode } from 'react';

/**
 * The card every panel sits in.
 *
 * The hairline along its top edge is the one piece of decoration here: it
 * marks the surface as the active one without a heavy border, and it is the
 * same gradient as the primary action so the two read as the same system.
 */
export const SurfaceCard: React.FC<{ children: ReactNode; maxWidth?: number }> = ({
  children,
  maxWidth = 520,
}) => {
  const { palette } = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        '&::before': {
          background: `linear-gradient(90deg, ${palette.primary.main}, ${palette.success.main})`,
          content: '""',
          height: 2,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        },
        borderRadius: 3,
        maxWidth,
        mx: 'auto',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      <Box sx={{ p: 3 }}>{children}</Box>
    </Paper>
  );
};

/** The panel title. One per card, and the card's only large text. */
export const PanelTitle: React.FC<{ action?: ReactNode; children: ReactNode }> = ({
  action,
  children,
}) => (
  <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
    {/* Tight leading and negative tracking: large text reads too loose at
        default values, and the gap grows with the size. */}
    <Typography
      sx={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}
    >
      {children}
    </Typography>
    {action}
  </Stack>
);

/**
 * An amount well: a caption, the figure, and the asset it is denominated in.
 *
 * The figure is the largest thing in the card because it is the number being
 * decided about. The caption above it is small and tracked slightly open,
 * which is the opposite treatment — one letter-spacing cannot serve both.
 */
export const AmountWell: React.FC<{
  label: string;
  right: ReactNode;
  secondary?: ReactNode;
  value: ReactNode;
}> = ({ label, right, secondary, value }) => (
  <Box
    sx={{
      bgcolor: 'action.hover',
      border: 1,
      borderColor: 'divider',
      borderRadius: 2.5,
      px: 2,
      py: 1.75,
    }}
  >
    <Typography
      sx={{
        color: 'text.secondary',
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Typography>

    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 0.5 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>{value}</Box>
      {right}
    </Stack>

    {secondary && <Box sx={{ mt: 0.75 }}>{secondary}</Box>}
  </Box>
);

/** The asset selector inside a well. Reads as one object, not a dropdown. */
export const TokenPill: React.FC<{
  disabled?: boolean;
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ disabled = false, icon, label, onClick }) => (
  <Button
    onClick={onClick}
    disabled={disabled}
    endIcon={<KeyboardArrowDown sx={{ fontSize: 18 }} />}
    sx={{
      '&:hover': { bgcolor: 'background.paper', borderColor: 'text.disabled' },
      bgcolor: 'background.paper',
      border: 1,
      borderColor: 'divider',
      borderRadius: 999,
      color: 'text.primary',
      flexShrink: 0,
      fontWeight: 600,
      px: 1.5,
      py: 0.75,
      textTransform: 'none',
    }}
  >
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
      {icon}
      <span>{label}</span>
    </Stack>
  </Button>
);

/**
 * The card's single primary action.
 *
 * Press feedback is instant and the scale is small — a large bounce on a
 * full-width button reads as a toy. Reduced motion drops it entirely rather
 * than substituting something else, because there is nothing to substitute.
 */
export const PrimaryAction: React.FC<{
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  startIcon?: ReactNode;
}> = ({ children, disabled = false, onClick, startIcon }) => {
  const { palette } = useTheme();

  return (
    <Button
      fullWidth
      disabled={disabled}
      onClick={onClick}
      startIcon={startIcon}
      sx={{
        '@media (prefers-reduced-motion: reduce)': {
          '&:active': { transform: 'none' },
          transition: 'none',
        },
        '&:active': { transform: 'scale(0.99)' },
        '&:hover': { filter: 'brightness(1.05)' },
        '&.Mui-disabled': {
          background: palette.action.disabledBackground,
          color: palette.text.disabled,
        },
        background: `linear-gradient(90deg, ${palette.primary.main}, ${palette.success.main})`,
        borderRadius: 2.5,
        color: palette.primary.contrastText,
        fontSize: '0.9375rem',
        fontWeight: 700,
        letterSpacing: '-0.01em',
        py: 1.5,
        textTransform: 'none',
        transition: 'transform 100ms ease-out, filter 120ms ease-out',
      }}
    >
      {children}
    </Button>
  );
};

/** A row of mutually exclusive choices — slippage, fee tier, sort. */
export const ChoiceRow: React.FC<{
  label: string;
  onChange: (value: number) => void;
  options: { label: string; value: number }[];
  value: number;
}> = ({ label, onChange, options, value }) => (
  <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', py: 0.75 }}>
    <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>{label}</Typography>
    <Stack direction="row" spacing={0.75}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Box
            key={option.value}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onChange(option.value);
            }}
            sx={{
              border: 1,
              borderColor: active ? 'primary.main' : 'divider',
              borderRadius: 1.5,
              color: active ? 'primary.main' : 'text.secondary',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontWeight: active ? 600 : 400,
              px: 1.25,
              py: 0.5,
              userSelect: 'none',
            }}
          >
            {option.label}
          </Box>
        );
      })}
    </Stack>
  </Stack>
);
