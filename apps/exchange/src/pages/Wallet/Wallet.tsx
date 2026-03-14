/**
 * Wallet Page
 * Modern crypto dashboard with Material-UI theme matching landing page
 */
import { Outlet } from 'react-router-dom';
import { Box, Fade } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import { landingTheme } from '@/theme/landingTheme';

const WalletContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: theme.palette.background.default,
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
