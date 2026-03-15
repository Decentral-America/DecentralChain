import { Diamond, FlashOn, Login, PersonAdd, Security } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Fade,
  Grid,
  keyframes,
  Paper,
  Slide,
  styled,
  Typography,
  useTheme,
} from '@mui/material';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * DesktopPage Component
 *
 * Modern landing page for DecentralChain Desktop Electron application
 */

// Float animation
const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

// Gradient shift
const gradientShift = keyframes`
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
`;

// Container with animated gradient
const Container = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  animation: `${gradientShift} 20s ease infinite`,
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)'
      : 'linear-gradient(135deg, #e8f0fe 0%, #f5f7fa 50%, #e3f2fd 100%)',
  backgroundSize: '200% 200%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '100vh',
  overflow: 'hidden',
  padding: theme.spacing(5),
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

// Logo container with float animation
const LogoContainer = styled(Box)({
  animation: `${float} 4s ease-in-out infinite`,
  marginBottom: 32,
});

// Logo with glassmorphism
const LogoBox = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  backdropFilter: 'blur(10px)',
  background: theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.15)' : 'rgba(31, 90, 246, 0.1)',
  border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(31, 90, 246, 0.2)'}`,
  borderRadius: '30%',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(31, 90, 246, 0.3)'
      : '0 8px 32px rgba(31, 90, 246, 0.2)',
  display: 'flex',
  height: 120,
  justifyContent: 'center',
  width: 120,
}));

// Content section
const ContentSection = styled(Box)({
  maxWidth: 700,
  textAlign: 'center',
  zIndex: 1,
});

// Feature card with hover effect
const FeatureCard = styled(Paper)(({ theme }) => ({
  '&:hover': {
    background:
      theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.1)' : 'rgba(31, 90, 246, 0.05)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 12px 40px rgba(0, 0, 0, 0.5)'
        : '0 12px 40px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-8px)',
  },
  backdropFilter: 'blur(20px)',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  borderRadius: theme.spacing(2),
  height: '100%',
  padding: theme.spacing(3),
  transition: 'all 0.3s ease',
}));

// Actions container
const ActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  justifyContent: 'center',
  marginTop: theme.spacing(4),
}));

// Footer
const Footer = styled(Box)(({ theme }) => ({
  bottom: theme.spacing(3),
  color: theme.palette.text.secondary,
  position: 'absolute',
  textAlign: 'center',
}));

export const DesktopPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      color: '#1f5af6',
      description: 'Your keys never leave your device',
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure',
    },
    {
      color: '#f59e0b',
      description: 'Lightning-fast transactions',
      icon: <FlashOn sx={{ fontSize: 40 }} />,
      title: 'Fast',
    },
    {
      color: '#10b981',
      description: 'Easy-to-use interface',
      icon: <Diamond sx={{ fontSize: 40 }} />,
      title: 'Simple',
    },
  ];

  return (
    <Container>
      <Fade in={isVisible} timeout={600}>
        <Box sx={{ maxWidth: 700, width: '100%' }}>
          {/* Logo */}
          <LogoContainer>
            <LogoBox>
              <Typography
                sx={{
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                  fontSize: '3rem',
                  fontWeight: 800,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                DCC
              </Typography>
            </LogoBox>
          </LogoContainer>

          {/* Content */}
          <ContentSection>
            <Slide direction="up" in={isVisible} timeout={800}>
              <Box>
                <Typography
                  variant="h2"
                  sx={{
                    background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                    fontSize: { md: '3.5rem', xs: '2.5rem' },
                    fontWeight: 800,
                    mb: 2,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  DecentralChain Desktop
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: { md: '1.25rem', xs: '1.1rem' },
                    lineHeight: 1.6,
                    mb: 4,
                  }}
                >
                  Secure cryptocurrency wallet for desktop
                </Typography>
              </Box>
            </Slide>

            {/* Features */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {features.map((feature, index) => (
                <Grid
                  key={feature.title}
                  size={{
                    sm: 4,
                    xs: 12,
                  }}
                >
                  <Slide direction="up" in={isVisible} timeout={900 + index * 100}>
                    <FeatureCard elevation={0}>
                      <Box
                        sx={{
                          color: feature.color,
                          mb: 1,
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          mb: 0.5,
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {feature.description}
                      </Typography>
                    </FeatureCard>
                  </Slide>
                </Grid>
              ))}
            </Grid>

            {/* Actions */}
            <Fade in={isVisible} timeout={1200}>
              <ActionsContainer>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Login />}
                  onClick={() => navigate('/auth/signin')}
                  sx={{
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1a4ed0 0%, #4a71e6 100%)',
                      boxShadow: '0 6px 20px rgba(31, 90, 246, 0.4)',
                    },
                    background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                    borderRadius: 2,
                    boxShadow: '0 4px 16px rgba(31, 90, 246, 0.3)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate('/auth/signup')}
                  sx={{
                    '&:hover': {
                      background:
                        theme.palette.mode === 'dark'
                          ? 'rgba(31, 90, 246, 0.1)'
                          : 'rgba(31, 90, 246, 0.05)',
                      borderWidth: 2,
                    },
                    borderRadius: 2,
                    borderWidth: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                  }}
                >
                  Create Account
                </Button>
              </ActionsContainer>
            </Fade>
          </ContentSection>

          {/* Footer */}
          <Footer>
            <Typography variant="body2" sx={{ mb: 1 }}>
              © 2025 Decentral America. All rights reserved.
            </Typography>
            <Chip
              label="Desktop v1.0.0"
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            />
          </Footer>
        </Box>
      </Fade>
    </Container>
  );
};

export default DesktopPage;
