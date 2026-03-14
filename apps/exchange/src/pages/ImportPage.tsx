import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  styled,
  useTheme,
  Fade,
  Slide,
} from '@mui/material';
import { VpnKey, Folder, Security, Extension, ArrowForward } from '@mui/icons-material';

/**
 * ImportPage Component
 *
 * Modern hub page for all account import methods
 */

// Page container
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(4),
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)'
      : 'linear-gradient(180deg, #f5f7fa 0%, #e8f0fe 100%)',
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
  padding: theme.spacing(4, 3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(3),
  border: `2px solid transparent`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 24px rgba(0, 0, 0, 0.4)'
      : '0 8px 24px rgba(0, 0, 0, 0.06))',
  '&:hover': {
    transform: 'translateY(-8px)',
    borderColor: theme.palette.primary.main,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 12px 40px rgba(31, 90, 246, 0.3)'
        : '0 12px 40px rgba(31, 90, 246, 0.2)',
    background:
      theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.08)' : 'rgba(31, 90, 246, 0.04)',
  },
}));

// Icon container
const IconBox = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  margin: '0 auto 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
  color: 'white',
  fontSize: 40,
}));

// Footer section
const FooterSection = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginTop: theme.spacing(5),
  paddingTop: theme.spacing(4),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const importMethods = [
  {
    id: 'seed',
    title: 'Seed Phrase / Private Key',
    description: 'Import your account using a 15-word seed phrase or private key',
    icon: <VpnKey sx={{ fontSize: 40 }} />,
    route: '/auth/restore',
  },
  {
    id: 'backup',
    title: 'Backup File',
    description: 'Restore from an encrypted backup file (.json)',
    icon: <Folder sx={{ fontSize: 40 }} />,
    route: '/auth/fromBackup',
  },
  {
    id: 'ledger',
    title: 'Ledger Hardware Wallet',
    description: 'Connect and import accounts from your Ledger device',
    icon: <Security sx={{ fontSize: 40 }} />,
    route: '/auth/ledger',
  },
  {
    id: 'keeper',
    title: 'Waves Keeper Extension',
    description: 'Import from Waves Keeper browser extension',
    icon: <Extension sx={{ fontSize: 40 }} />,
    route: '/auth/keeper',
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
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 1.5,
                fontSize: { xs: '2rem', md: '2.5rem' },
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
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
              <Grid item xs={12} sm={6} key={method.id}>
                <Slide direction="up" in={isVisible} timeout={700 + index * 100}>
                  <MethodCard elevation={0} onClick={() => handleMethodClick(method.route)}>
                    <IconBox>{method.icon}</IconBox>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        mb: 1.5,
                        fontSize: '1.25rem',
                      }}
                    >
                      {method.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        mb: 3,
                        lineHeight: 1.6,
                      }}
                    >
                      {method.description}
                    </Typography>
                    <Button
                      variant="outlined"
                      fullWidth
                      endIcon={<ArrowForward />}
                      sx={{
                        fontWeight: 600,
                        textTransform: 'none',
                        borderWidth: 2,
                        py: 1.5,
                        '&:hover': {
                          borderWidth: 2,
                          background:
                            theme.palette.mode === 'dark'
                              ? 'rgba(31, 90, 246, 0.1)'
                              : 'rgba(31, 90, 246, 0.05)',
                        },
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
              Don't have an account yet?
            </Typography>
            <Button
              variant="text"
              size="large"
              onClick={() => navigate('/auth/signup')}
              sx={{
                fontWeight: 600,
                fontSize: '1.1rem',
                textTransform: 'none',
                color: theme.palette.primary.main,
                '&:hover': {
                  background:
                    theme.palette.mode === 'dark'
                      ? 'rgba(31, 90, 246, 0.1)'
                      : 'rgba(31, 90, 246, 0.05)',
                },
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
