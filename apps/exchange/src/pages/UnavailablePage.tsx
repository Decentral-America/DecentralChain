import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled,
  useTheme,
  Fade,
  keyframes,
} from '@mui/material';
import { Warning, Refresh, Home, CheckCircle } from '@mui/icons-material';

/**
 * UnavailablePage Component
 *
 * Modern error page displayed when:
 * - Browser is not supported (older versions without required features)
 * - Service is temporarily unavailable
 * - Feature is not available in current context
 */

// Pulse animation for warning icon
const pulse = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.05);
  }
`;

// Container with gradient background
const Container = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  textAlign: 'center',
  padding: theme.spacing(3),
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
      : 'linear-gradient(180deg, #f5f7fa 0%, #e8f0fe 100%)',
}));

// Warning icon with pulse animation
const IconContainer = styled(Box)(({ theme }) => ({
  fontSize: '80px',
  marginBottom: theme.spacing(3),
  animation: `${pulse} 2s ease-in-out infinite`,
  color: theme.palette.warning.main,
}));

// Content card with glassmorphism
const ContentCard = styled(Paper)(({ theme }) => ({
  maxWidth: 600,
  padding: theme.spacing(4),
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(3),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 12px 40px rgba(0, 0, 0, 0.5)'
      : '0 12px 40px rgba(0, 0, 0, 0.08)',
}));

// Details section
const DetailsSection = styled(Box)(({ theme }) => ({
  margin: theme.spacing(3, 0),
  padding: theme.spacing(2),
  background: theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.08)' : 'rgba(255, 193, 7, 0.05)',
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.15)'}`,
}));

// Button group
const ButtonGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginTop: theme.spacing(3),
}));

export const UnavailablePage: React.FC = () => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const browsers = [
    'Google Chrome 90+',
    'Mozilla Firefox 88+',
    'Microsoft Edge 90+',
    'Safari 14+',
    'Opera 76+',
  ];

  return (
    <Container>
      <Fade in={isVisible} timeout={600}>
        <ContentCard elevation={0}>
          <IconContainer>
            <Warning sx={{ fontSize: 'inherit' }} />
          </IconContainer>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 2,
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Service Unavailable
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
            }}
          >
            This feature is currently unavailable or your browser is not supported. Please try using
            a modern browser to access DecentralChain Wallet.
          </Typography>

          <DetailsSection>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1,
                color: theme.palette.warning.main,
              }}
            >
              Supported Browsers:
            </Typography>
            <List dense sx={{ pt: 1 }}>
              {browsers.map((browser, index) => (
                <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle
                      sx={{
                        fontSize: 18,
                        color: theme.palette.success.main,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={browser}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      color: theme.palette.text.secondary,
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </DetailsSection>

          <ButtonGroup>
            <Button
              variant="contained"
              size="large"
              startIcon={<Refresh />}
              onClick={handleReload}
              sx={{
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                color: 'white',
                px: 3,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(31, 90, 246, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1a4ed0 0%, #4a71e6 100%)',
                  boxShadow: '0 6px 16px rgba(31, 90, 246, 0.4)',
                },
              }}
            >
              Reload Page
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Home />}
              onClick={handleGoHome}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
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
              Go to Home
            </Button>
          </ButtonGroup>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 4,
              color: theme.palette.text.secondary,
              opacity: 0.7,
            }}
          >
            If the problem persists, please contact support or check your browser version.
          </Typography>
        </ContentCard>
      </Fade>
    </Container>
  );
};

export default UnavailablePage;
