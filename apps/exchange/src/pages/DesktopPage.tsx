import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  styled,
  useTheme,
  Fade,
  Slide,
  keyframes,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Security, FlashOn, Diamond, Login, PersonAdd } from '@mui/icons-material';

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
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(5),
  position: 'relative',
  overflow: 'hidden',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)'
      : 'linear-gradient(135deg, #e8f0fe 0%, #f5f7fa 50%, #e3f2fd 100%)',
  backgroundSize: '200% 200%',
  animation: `${gradientShift} 20s ease infinite`,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

// Logo container with float animation
const LogoContainer = styled(Box)({
  marginBottom: 32,
  animation: `${float} 4s ease-in-out infinite`,
});

// Logo with glassmorphism
const LogoBox = styled(Box)(({ theme }) => ({
  width: 120,
  height: 120,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '30%',
  background: theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.15)' : 'rgba(31, 90, 246, 0.1)',
  backdropFilter: 'blur(10px)',
  border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(31, 90, 246, 0.2)'}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(31, 90, 246, 0.3)'
      : '0 8px 32px rgba(31, 90, 246, 0.2)',
}));

// Content section
const ContentSection = styled(Box)({
  textAlign: 'center',
  maxWidth: 700,
  zIndex: 1,
});

// Feature card with hover effect
const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 12px 40px rgba(0, 0, 0, 0.5)'
        : '0 12px 40px rgba(0, 0, 0, 0.1)',
    background:
      theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.1)' : 'rgba(31, 90, 246, 0.05)',
  },
}));

// Actions container
const ActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
  flexWrap: 'wrap',
  justifyContent: 'center',
}));

// Footer
const Footer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(3),
  textAlign: 'center',
  color: theme.palette.text.secondary,
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
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure',
      description: 'Your keys never leave your device',
      color: '#1f5af6',
    },
    {
      icon: <FlashOn sx={{ fontSize: 40 }} />,
      title: 'Fast',
      description: 'Lightning-fast transactions',
      color: '#f59e0b',
    },
    {
      icon: <Diamond sx={{ fontSize: 40 }} />,
      title: 'Simple',
      description: 'Easy-to-use interface',
      color: '#10b981',
    },
  ];

  return (
    <Container>
      <Fade in={isVisible} timeout={600}>
        <Box sx={{ width: '100%', maxWidth: 700 }}>
          {/* Logo */}
          <LogoContainer>
            <LogoBox>
              <Typography
                sx={{
                  fontSize: '3rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
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
                    fontWeight: 800,
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  DecentralChain Desktop
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 4,
                    color: theme.palette.text.secondary,
                    lineHeight: 1.6,
                    fontSize: { xs: '1.1rem', md: '1.25rem' },
                  }}
                >
                  Secure cryptocurrency wallet for desktop
                </Typography>
              </Box>
            </Slide>

            {/* Features */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={4} key={index}>
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
                          fontWeight: 600,
                          mb: 0.5,
                          fontSize: '1.1rem',
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
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                    boxShadow: '0 4px 16px rgba(31, 90, 246, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1a4ed0 0%, #4a71e6 100%)',
                      boxShadow: '0 6px 20px rgba(31, 90, 246, 0.4)',
                    },
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
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      background:
                        theme.palette.mode === 'dark'
                          ? 'rgba(31, 90, 246, 0.1)'
                          : 'rgba(31, 90, 246, 0.05)',
                    },
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
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />
          </Footer>
        </Box>
      </Fade>
    </Container>
  );
};

export default DesktopPage;
