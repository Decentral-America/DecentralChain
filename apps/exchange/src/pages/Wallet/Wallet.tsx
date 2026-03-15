/**
 * Wallet Page
 * Modern crypto dashboard with Material-UI theme matching landing page
 */

import { Box, Fade } from '@mui/material';
import { styled, ThemeProvider } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { landingTheme } from '@/theme/landingTheme';

const WalletContainer = styled(Box)(({ theme }) => ({
  background: theme.palette.background.default,
  minHeight: '100vh',
  padding: theme.spacing(3),

  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

export const Wallet = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <ThemeProvider theme={landingTheme}>
      <WalletContainer>
        <Fade in={isVisible} timeout={800}>
          <Box>
            <Outlet />
          </Box>
        </Fade>
      </WalletContainer>
    </ThemeProvider>
  );
};
