import { Box, Typography } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface LogoProps {
  sx?: SxProps<Theme>;
}

/**
 * DCC Brand Logo
 */
export default function Logo({ sx }: LogoProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          fontSize: { xs: 20, md: 24 },
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
