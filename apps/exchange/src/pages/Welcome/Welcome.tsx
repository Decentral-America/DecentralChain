/**
 * Welcome Page
 * Landing page for wallet creation/import
 * Modern crypto-inspired design with animated elements
 */

import {
  Box,
  Fade,
  keyframes,
  Slide,
  Typography,
  useMediaQuery,
  useTheme,
  Zoom,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Stack } from '@/components/atoms/Stack';

// Animated gradient background
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Floating animation for decorative elements
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
`;

// Pulse glow effect
const pulseGlow = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

const WelcomeContainer = styled(Box)(({ theme }) => ({
  animation: `${gradientAnimation} 15s ease infinite`,
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(-45deg, #0a0e27, #1a1f3a, #0f1729, #1e2338)'
      : 'linear-gradient(-45deg, #f5f7fa, #e8f0fe, #f0f4f8, #e3f2fd)',
  backgroundSize: '400% 400%',
  display: 'flex',
  minHeight: '100vh',
  overflow: 'hidden',
  position: 'relative',

  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
  },
}));

const LeftPanel = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  backdropFilter: 'blur(10px)',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(31, 90, 246, 0.15) 0%, rgba(90, 129, 255, 0.15) 100%)'
      : 'linear-gradient(135deg, rgba(31, 90, 246, 0.08) 0%, rgba(90, 129, 255, 0.08) 100%)',
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
  overflow: 'hidden',
  padding: theme.spacing(6),
  position: 'relative',

  [theme.breakpoints.down('md')]: {
    minHeight: 'auto',
    padding: theme.spacing(3),
  },
}));

const RightPanel = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
  padding: theme.spacing(6),
  position: 'relative',

  [theme.breakpoints.down('md')]: {
    minHeight: 'auto',
    padding: theme.spacing(3),
  },
}));

// Animated geometric shapes
const FloatingShape = styled(Box, {
  shouldForwardProp: (prop) => !['delay', 'duration'].includes(prop as string),
})<{ delay?: number; duration?: number }>(({ theme, delay = 0, duration = 6 }) => ({
  animation: `${float} ${duration}s ease-in-out infinite`,
  animationDelay: `${delay}s`,
  background:
    theme.palette.mode === 'dark'
      ? 'radial-gradient(circle, rgba(31, 90, 246, 0.3), transparent)'
      : 'radial-gradient(circle, rgba(31, 90, 246, 0.2), transparent)',
  borderRadius: '50%',
  filter: 'blur(40px)',
  position: 'absolute',
}));

const HexagonPattern = styled(Box)(({ theme }) => ({
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23${theme.palette.mode === 'dark' ? 'ffffff' : '000000'}' stroke-width='1'/%3E%3C/svg%3E")`,
  backgroundSize: '60px 60px',
  bottom: 0,
  left: 0,
  opacity: theme.palette.mode === 'dark' ? 0.03 : 0.02,
  position: 'absolute',
  right: 0,
  top: 0,
}));

const GlowingOrb = styled(Box)(({ theme }) => ({
  animation: `${pulseGlow} 4s ease-in-out infinite`,
  background: `radial-gradient(circle, ${theme.palette.primary.main}40, transparent)`,
  borderRadius: '50%',
  height: '300px',
  pointerEvents: 'none',
  position: 'absolute',
  width: '300px',
}));

const BrandContent = styled(Box)(() => ({
  maxWidth: '600px',
  position: 'relative',
  zIndex: 2,
}));

const ContentBox = styled(Box)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.6)' : 'rgba(255, 255, 255, 0.8)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
  borderRadius: theme.spacing(3),
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 20px 60px rgba(0, 0, 0, 0.5)'
      : '0 20px 60px rgba(0, 0, 0, 0.1)',
  maxWidth: '500px',
  padding: theme.spacing(4),
  position: 'relative',
  width: '100%',
  zIndex: 2,

  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

export const Welcome = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <WelcomeContainer>
      {/* Decorative floating shapes */}
      <FloatingShape
        sx={{ height: 200, left: '5%', top: '10%', width: 200 }}
        delay={0}
        duration={6}
      />
      <FloatingShape
        sx={{ bottom: '15%', height: 300, right: '10%', width: 300 }}
        delay={1}
        duration={8}
      />
      <FloatingShape
        sx={{ height: 150, left: '15%', top: '60%', width: 150 }}
        delay={2}
        duration={7}
      />

      <LeftPanel>
        <HexagonPattern />
        <GlowingOrb sx={{ left: '-100px', top: '-100px' }} />
        <GlowingOrb sx={{ bottom: '-150px', right: '-150px' }} />

        <Fade in={isVisible} timeout={1000}>
          <BrandContent>
            <Slide direction="right" in={isVisible} timeout={800}>
              <Typography
                variant="h1"
                sx={{
                  background:
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)'
                      : 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                  backgroundClip: 'text',
                  fontSize: { lg: '4rem', md: '3.5rem', sm: '3rem', xs: '2.5rem' },
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  mb: 3,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                DecentralChain Wallet
              </Typography>
            </Slide>

            <Slide direction="right" in={isVisible} timeout={1000}>
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.700',
                  fontSize: { md: '1.25rem', sm: '1.125rem', xs: '1rem' },
                  fontWeight: 400,
                  lineHeight: 1.7,
                  mb: 5,
                  opacity: 0.9,
                }}
              >
                Your gateway to the DecentralChain blockchain. Trade, send, and manage your digital
                assets with enterprise-grade security and lightning-fast transactions.
              </Typography>
            </Slide>

            <Zoom in={isVisible} timeout={1200}>
              <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
                <Button
                  variant="primary"
                  onClick={() => navigate('/signup')}
                  size="large"
                  sx={{
                    '&:hover': {
                      boxShadow: '0 12px 32px rgba(31, 90, 246, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                    borderRadius: 2,
                    boxShadow: '0 8px 24px rgba(31, 90, 246, 0.4)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Create New Wallet
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/signin')}
                  size="large"
                  sx={{
                    '&:hover': {
                      background:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'rgba(31, 90, 246, 0.15)',
                      transform: 'translateY(-2px)',
                    },
                    background:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(31, 90, 246, 0.1)',
                    border: `2px solid ${theme.palette.primary.main}`,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Sign In
                </Button>
              </Stack>
            </Zoom>

            {/* Feature highlights */}
            <Fade in={isVisible} timeout={1500}>
              <Stack direction="row" spacing={4} sx={{ mt: 6 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700, mb: 0.5 }}>
                    256-bit
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Encryption
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700, mb: 0.5 }}>
                    &lt;100ms
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Transactions
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700, mb: 0.5 }}>
                    24/7
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Support
                  </Typography>
                </Box>
              </Stack>
            </Fade>
          </BrandContent>
        </Fade>
      </LeftPanel>

      <RightPanel>
        <Zoom in={isVisible} timeout={1000}>
          <ContentBox>
            <Outlet />
          </ContentBox>
        </Zoom>
      </RightPanel>
    </WelcomeContainer>
  );
};
