/**
 * Wallet Page
 *
 * Parent route for the wallet module. It passes the shell's height straight
 * through so a screen inside it can fit the shell exactly; padding and rhythm
 * belong to `PageFrame`.
 *
 * It used to wrap every wallet screen in the light marketing theme, which
 * pinned the whole module to light mode whatever the holder had chosen, and
 * fade it in over 800ms on arrival. The app theme now reaches these screens
 * unchanged, and they appear immediately.
 *
 * On mobile it supplies nothing at all: the mobile screens own their layout.
 */

import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Outlet } from 'react-router';

export const Wallet = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'), { noSsr: true });

  if (isMobile) {
    return <Outlet />;
  }

  return (
    <Box sx={{ height: '100%' }}>
      <Outlet />
    </Box>
  );
};
