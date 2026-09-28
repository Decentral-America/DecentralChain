import { Box, Typography } from '@mui/material';
import { type SxProps, type Theme, useTheme } from '@mui/material/styles';
import { tokens } from '@/theme/tokens/semantic';

/**
 * The brand mark and wordmark.
 *
 * The mark (the chain monogram) is artwork from /public/brand, whose file names
 * say which ground they belong on. The wordmark stays live text rather than the
 * `logo-on-*` artwork: that artwork's ".Exchange" is a fixed deep indigo, which
 * fails 3:1 large-text contrast on a dark canvas. As text it takes the accent
 * of whichever ground it sits on.
 */

interface LogoProps {
  sx?: SxProps<Theme>;
  /**
   * The surface behind the logo is dark — use the white-ink brand mark. Omit it
   * to follow the active theme, which is right for anything on the app ground.
   */
  onDark?: boolean | undefined;
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
export default function Logo({ sx, onDark, compact = false }: LogoProps) {
  const theme = useTheme();
  const dark = onDark ?? theme.palette.mode === 'dark';
  const ground = tokens(dark ? 'dark' : 'light');

  if (compact) {
    return (
      <Box
        component="img"
        src={dark ? '/brand/mark-on-dark.png' : '/brand/mark-on-light.png'}
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
          color: ground.text.primary,
          fontSize: { md: 24, xs: 20 },
          fontWeight: 700,
          letterSpacing: '-0.5px',
        }}
      >
        Decentral
        <Box
          component="span"
          sx={{
            // The accent of the ground the logo sits on: the light-mode indigo
            // fails 3:1 large-text contrast on a dark canvas, and the dark-mode
            // one clears it (5.66:1 on black).
            color: ground.accent.primary,
          }}
        >
          .Exchange
        </Box>
      </Typography>
    </Box>
  );
}
