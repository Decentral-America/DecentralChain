/**
 * Welcome Page
 * Landing page for wallet creation/import
 * Modern crypto-inspired design with animated elements
 */
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Fade,
  Slide,
  Zoom,
  useTheme,
  useMediaQuery,
  keyframes,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Button } from '@/components/atoms/Button';
import { Stack } from '@/components/atoms/Stack';
import { useEffect, useState } from 'react';

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
  display: 'flex',
  minHeight: '100vh',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(-45deg, #0a0e27, #1a1f3a, #0f1729, #1e2338)'
      : 'linear-gradient(-45deg, #f5f7fa, #e8f0fe, #f0f4f8, #e3f2fd)',
  backgroundSize: '400% 400%',
  animation: `${gradientAnimation} 15s ease infinite`,
  position: 'relative',
  overflow: 'hidden',

  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
  },
}));

const LeftPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),
  position: 'relative',
  overflow: 'hidden',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(31, 90, 246, 0.15) 0%, rgba(90, 129, 255, 0.15) 100%)'
      : 'linear-gradient(135deg, rgba(31, 90, 246, 0.08) 0%, rgba(90, 129, 255, 0.08) 100%)',
  backdropFilter: 'blur(10px)',

  [theme.breakpoints.down('md')]: {
    minHeight: 'auto',
    padding: theme.spacing(3),
  },
}));

const RightPanel = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
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
  position: 'absolute',
  borderRadius: '50%',
  background:
    theme.palette.mode === 'dark'
      ? 'radial-gradient(circle, rgba(31, 90, 246, 0.3), transparent)'
      : 'radial-gradient(circle, rgba(31, 90, 246, 0.2), transparent)',
  animation: `${float} ${duration}s ease-in-out infinite`,
  animationDelay: `${delay}s`,
  filter: 'blur(40px)',
}));

const HexagonPattern = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: theme.palette.mode === 'dark' ? 0.03 : 0.02,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23${theme.palette.mode === 'dark' ? 'ffffff' : '000000'}' stroke-width='1'/%3E%3C/svg%3E")`,
  backgroundSize: '60px 60px',
}));

const GlowingOrb = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '300px',
  height: '300px',
  borderRadius: '50%',
  background: `radial-gradient(circle, ${theme.palette.primary.main}40, transparent)`,
  animation: `${pulseGlow} 4s ease-in-out infinite`,
  pointerEvents: 'none',
}));

const BrandContent = styled(Box)(() => ({
  maxWidth: '600px',
  zIndex: 2,
  position: 'relative',
}));

const ContentBox = styled(Box)(({ theme }) => ({
  maxWidth: '500px',
  width: '100%',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.6)' : 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(3),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 20px 60px rgba(0, 0, 0, 0.5)'
      : '0 20px 60px rgba(0, 0, 0, 0.1)',
  padding: theme.spacing(4),
  position: 'relative',
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
        sx={{ width: 200, height: 200, top: '10%', left: '5%' }}
        delay={0}
        duration={6}
      />
      <FloatingShape
        sx={{ width: 300, height: 300, bottom: '15%', right: '10%' }}
        delay={1}
        duration={8}
      />
      <FloatingShape
        sx={{ width: 150, height: 150, top: '60%', left: '15%' }}
        delay={2}
        duration={7}
      />

      <LeftPanel>
        <HexagonPattern />
        <GlowingOrb sx={{ top: '-100px', left: '-100px' }} />
        <GlowingOrb sx={{ bottom: '-150px', right: '-150px' }} />

        <Fade in={isVisible} timeout={1000}>
          <BrandContent>
            <Slide direction="right" in={isVisible} timeout={800}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem', lg: '4rem' },
                  fontWeight: 800,
                  mb: 3,
                  background:
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)'
                      : 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}
              >
                DecentralChain Wallet
              </Typography>
            </Slide>

            <Slide direction="right" in={isVisible} timeout={1000}>
              <Typography
                variant="h5"
                sx={{
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                  mb: 5,
                  opacity: 0.9,
                  lineHeight: 1.7,
                  color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.700',
                  fontWeight: 400,
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
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    boxShadow: '0 8px 24px rgba(31, 90, 246, 0.4)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 32px rgba(31, 90, 246, 0.5)',
                    },
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
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: 'none',
                    background:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(31, 90, 246, 0.1)',
                    border: `2px solid ${theme.palette.primary.main}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      background:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'rgba(31, 90, 246, 0.15)',
                    },
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
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                    256-bit
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Encryption
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
                    &lt;100ms
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Transactions
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 0.5 }}>
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
