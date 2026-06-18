import { Box, Typography } from '@mui/material';
import { type SxProps, type Theme } from '@mui/material/styles';

interface LogoProps {
  sx?: SxProps<Theme>;
}

/**
 * DCC Brand Logo
 */
export default function Logo({ sx }: LogoProps) {
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
        variant="h6"
        sx={{
          fontSize: { md: 24, xs: 20 },
          fontWeight: 700,
          letterSpacing: '-0.5px',
        }}
      >
        Decentral
        <Box component="span" sx={{ color: 'primary.main' }}>
          .Exchange
        </Box>
      </Typography>
    </Box>
  );
}
