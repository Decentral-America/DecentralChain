import { ArrowForward, Extension, Folder, Security, VpnKey } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Fade,
  Grid,
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
 * ImportPage Component
 *
 * Modern hub page for all account import methods
 */

// Page container
const PageContainer = styled(Box)(({ theme }) => ({
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
      : 'linear-gradient(180deg, #f5f7fa 0%, #e8f0fe 100%)',
  minHeight: '100vh',
  padding: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

// Content wrapper
const ContentWrapper = styled(Container)(({ theme }) => ({
  maxWidth: '900px !important',
  paddingTop: theme.spacing(6),
}));

// Method card with glassmorphism
const MethodCard = styled(Paper)(({ theme }) => ({
  '&:hover': {
    background:
      theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.08)' : 'rgba(31, 90, 246, 0.04)',
    borderColor: theme.palette.primary.main,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 12px 40px rgba(31, 90, 246, 0.3)'
        : '0 12px 40px rgba(31, 90, 246, 0.2)',
    transform: 'translateY(-8px)',
  },
  backdropFilter: 'blur(20px)',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  border: `2px solid transparent`,
  borderRadius: theme.spacing(3),
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 24px rgba(0, 0, 0, 0.4)'
      : '0 8px 24px rgba(0, 0, 0, 0.06))',
  cursor: 'pointer',
  padding: theme.spacing(4, 3),
  textAlign: 'center',
  transition: 'all 0.3s ease',
}));

// Icon container
const IconBox = styled(Box)(({ theme: _theme }) => ({
  alignItems: 'center',
  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
  borderRadius: '50%',
  color: 'white',
  display: 'flex',
  fontSize: 40,
  height: 80,
  justifyContent: 'center',
  margin: '0 auto 20px',
  width: 80,
}));

// Footer section
const FooterSection = styled(Box)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(5),
  paddingTop: theme.spacing(4),
  textAlign: 'center',
}));

const importMethods = [
  {
    description: 'Import your account using a 15-word seed phrase or private key',
    icon: <VpnKey sx={{ fontSize: 40 }} />,
    id: 'seed',
    route: '/auth/restore',
    title: 'Seed Phrase / Private Key',
  },
  {
    description: 'Restore from an encrypted backup file (.json)',
    icon: <Folder sx={{ fontSize: 40 }} />,
    id: 'backup',
    route: '/auth/fromBackup',
    title: 'Backup File',
  },
  {
    description: 'Connect and import accounts from your Ledger device',
    icon: <Security sx={{ fontSize: 40 }} />,
    id: 'ledger',
    route: '/auth/ledger',
    title: 'Ledger Hardware Wallet',
  },
  {
    description: 'Import from Cubensis Connect browser extension',
    icon: <Extension sx={{ fontSize: 40 }} />,
    id: 'keeper',
    route: '/auth/keeper',
    title: 'Cubensis Connect Extension',
  },
];

export const ImportPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleMethodClick = (route: string) => {
    navigate(route);
  };

  return (
    <PageContainer>
      <Fade in={isVisible} timeout={600}>
        <ContentWrapper>
          {/* Header */}
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography
              variant="h2"
              sx={{
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                fontSize: { md: '2.5rem', xs: '2rem' },
                fontWeight: 800,
                mb: 1.5,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Import Account
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 400,
              }}
            >
              Choose your import method to get started
            </Typography>
          </Box>

          {/* Import Methods Grid */}
          <Grid container spacing={3} sx={{ mb: 5 }}>
            {importMethods.map((method, index) => (
              <Grid
                key={method.id}
                size={{
                  sm: 6,
                  xs: 12,
                }}
              >
                <Slide direction="up" in={isVisible} timeout={700 + index * 100}>
                  <MethodCard elevation={0} onClick={() => handleMethodClick(method.route)}>
                    <IconBox>{method.icon}</IconBox>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        mb: 1.5,
                      }}
                    >
                      {method.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.6,
                        mb: 3,
                      }}
                    >
                      {method.description}
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      endIcon={<ArrowForward />}
                      sx={{
                        '&:hover': {
                          background:
                            theme.palette.mode === 'dark'
                              ? 'rgba(31, 90, 246, 0.1)'
                              : 'rgba(31, 90, 246, 0.05)',
                          borderWidth: 2,
                        },
                        borderWidth: 2,
                        fontWeight: 600,
                        py: 1.5,
                        textTransform: 'none',
                      }}
                    >
                      Choose
                    </Button>
                  </MethodCard>
                </Slide>
              </Grid>
            ))}
          </Grid>

          {/* Footer */}
          <FooterSection>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            >
              Don&apos;t have an account yet?
            </Typography>
            <Button
              variant="text"
              size="large"
              onClick={() => navigate('/auth/signup')}
              sx={{
                '&:hover': {
                  background:
                    theme.palette.mode === 'dark'
                      ? 'rgba(31, 90, 246, 0.1)'
                      : 'rgba(31, 90, 246, 0.05)',
                },
                color: theme.palette.primary.main,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
              }}
            >
              Create New Account
            </Button>
          </FooterSection>
        </ContentWrapper>
      </Fade>
    </PageContainer>
  );
};
