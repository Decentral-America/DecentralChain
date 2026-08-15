import { Box, Typography } from '@mui/material';
import { type SxProps, type Theme } from '@mui/material/styles';
import { palette } from '@/styles/tokens';

interface LogoProps {
  sx?: SxProps<Theme>;
  /** The surface behind the logo is dark — use the white-ink brand mark. */
  onDark?: boolean;
  /**
   * Renders the brand monogram only (ported from the standalone exchange
   * app's mobile shell, which has no room for the wordmark). Uses the
   * `/brand/mark-on-*` artwork rather than the favicon.
   */
  compact?: boolean;
}

/**
 * DCC Brand Logo
 */
export default function Logo({ sx, onDark = false, compact = false }: LogoProps) {
  if (compact) {
    return (
      <Box
        component="img"
        src={onDark ? '/brand/mark-on-dark.png' : '/brand/mark-on-light.png'}
        alt="DecentralChain"
        sx={{ display: 'block', height: 32, width: 32, ...sx }}
      />
    );
  }

  return (
    <Box sx={{ alignItems: 'center', display: 'flex', gap: 1.5, ...sx }}>
      <Box
        component="img"
        src="/favicon.png?v=3"
        alt="DecentralChain"
        sx={{
          borderRadius: '50%',
          height: { md: 36, xs: 30 },
          width: { md: 36, xs: 30 },
        }}
      />
      <Typography
        component="span"
        variant="h6"
        sx={{
          fontSize: { md: 24, xs: 20 },
          fontWeight: 700,
          letterSpacing: '-0.5px',
        }}
      >
        Decentral
        <Box
          component="span"
          sx={{
            // primary.main (#3d26be) fails 3:1 large-text contrast against the
            // dark canvas — indigoHover clears it at ~6.3:1.
            color: onDark ? palette.indigoHover : 'primary.main',
          }}
        >
          .Exchange
        </Box>
      </Typography>
    </Box>
  );
}
