import { CheckCircle, Home, Refresh, Warning } from '@mui/icons-material';
import {
  Box,
  Button,
  Fade,
  keyframes,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  styled,
  Typography,
  useTheme,
} from '@mui/material';
import type React from 'react';
import { useEffect, useState } from 'react';

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
  alignItems: 'center',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
      : 'linear-gradient(180deg, #f5f7fa 0%, #e8f0fe 100%)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(3),
  textAlign: 'center',
}));

// Warning icon with pulse animation
const IconContainer = styled(Box)(({ theme }) => ({
  animation: `${pulse} 2s ease-in-out infinite`,
  color: theme.palette.warning.main,
  fontSize: '80px',
  marginBottom: theme.spacing(3),
}));

// Content card with glassmorphism
const ContentCard = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  borderRadius: theme.spacing(3),
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 12px 40px rgba(0, 0, 0, 0.5)'
      : '0 12px 40px rgba(0, 0, 0, 0.08)',
  maxWidth: 600,
  padding: theme.spacing(4),
}));

// Details section
const DetailsSection = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.08)' : 'rgba(255, 193, 7, 0.05)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.15)'}`,
  borderRadius: theme.spacing(2),
  margin: theme.spacing(3, 0),
  padding: theme.spacing(2),
}));

// Button group
const ButtonGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1.5),
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
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              fontWeight: 800,
              mb: 2,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Service Unavailable
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
              mb: 3,
            }}
          >
            This feature is currently unavailable or your browser is not supported. Please try using
            a modern browser to access DecentralChain Wallet.
          </Typography>

          <DetailsSection>
            <Typography
              variant="subtitle2"
              sx={{
                color: theme.palette.warning.main,
                fontWeight: 600,
                mb: 1,
              }}
            >
              Supported Browsers:
            </Typography>
            <List dense sx={{ pt: 1 }}>
              {browsers.map((browser) => (
                <ListItem key={browser} disablePadding sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle
                      sx={{
                        color: theme.palette.success.main,
                        fontSize: 18,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={browser}
                    primaryTypographyProps={{
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem',
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
                '&:hover': {
                  background: 'linear-gradient(135deg, #1a4ed0 0%, #4a71e6 100%)',
                  boxShadow: '0 6px 16px rgba(31, 90, 246, 0.4)',
                },
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(31, 90, 246, 0.3)',
                color: 'white',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                textTransform: 'none',
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
                '&:hover': {
                  background:
                    theme.palette.mode === 'dark'
                      ? 'rgba(31, 90, 246, 0.1)'
                      : 'rgba(31, 90, 246, 0.05)',
                  borderWidth: 2,
                },
                borderRadius: 2,
                borderWidth: 2,
                fontWeight: 600,
                px: 3,
                py: 1.5,
                textTransform: 'none',
              }}
            >
              Go to Home
            </Button>
          </ButtonGroup>

          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              display: 'block',
              mt: 4,
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
