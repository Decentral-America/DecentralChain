import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, ButtonBase, Typography, useTheme } from '@mui/material';
import { tokens } from '@/theme/tokens/semantic';
import { REDUCED, T_FAST } from './terminalTokens';

/** The market, as the thing you click to change it. */
export function SymbolButton({
  base,
  onClick,
  quote,
}: {
  base: string;
  onClick: () => void;
  quote: string;
}) {
  const t = tokens(useTheme().palette.mode);
  return (
    <ButtonBase
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={`Change market. Current market ${base} ${quote}`}
      sx={{
        '&:active': { transform: 'scale(0.98)' },
        '&:hover': { bgcolor: t.surface.hover },
        [REDUCED]: { transition: 'none' },
        alignItems: 'center',
        borderRadius: '9px',
        display: 'flex',
        flexShrink: 0,
        gap: 1,
        height: 32,
        pl: 0.75,
        pr: 1,
        transition: `background-color ${T_FAST}, transform 100ms ease-out`,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          alignItems: 'center',
          bgcolor: t.accent.muted,
          borderRadius: '50%',
          color: t.accent.primary,
          display: 'flex',
          fontSize: 10,
          fontWeight: 700,
          height: 22,
          justifyContent: 'center',
          letterSpacing: '0.02em',
          width: 22,
        }}
      >
        {base.slice(0, 2).toUpperCase()}
      </Box>
      <Typography
        component="span"
        sx={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1 }}
      >
        {base}
        <Box component="span" sx={{ color: t.text.tertiary, fontWeight: 500 }}>
          {' / '}
          {quote}
        </Box>
      </Typography>
      <KeyboardArrowDown sx={{ color: t.text.secondary, fontSize: 18, ml: -0.5 }} />
    </ButtonBase>
  );
}
