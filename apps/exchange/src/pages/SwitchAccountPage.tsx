import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Chip,
  styled,
  useTheme,
  Fade,
  Slide,
} from '@mui/material';
import { AccountCircle, CheckCircle, SwapHoriz, PersonOutline } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

/**
 * SwitchAccountPage Component
 *
 * Modern account switcher with glassmorphic cards
 */

// Container with gradient background
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
  maxWidth: '600px !important',
  paddingTop: theme.spacing(6),
}));

// Header section
const HeaderSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

// Account card with glassmorphism
const AccountCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>(({ theme, isActive }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  background: isActive
    ? theme.palette.mode === 'dark'
      ? 'rgba(31, 90, 246, 0.15)'
      : 'rgba(31, 90, 246, 0.08)'
    : theme.palette.mode === 'dark'
      ? 'rgba(26, 31, 58, 0.9)'
      : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(2),
  border: isActive
    ? `2px solid ${theme.palette.primary.main}`
    : `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 24px rgba(0, 0, 0, 0.4)'
      : '0 8px 24px rgba(0, 0, 0, 0.06)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 12px 32px rgba(0, 0, 0, 0.5)'
        : '0 12px 32px rgba(0, 0, 0, 0.1)',
    background: isActive
      ? theme.palette.mode === 'dark'
        ? 'rgba(31, 90, 246, 0.2)'
        : 'rgba(31, 90, 246, 0.12)'
      : theme.palette.mode === 'dark'
        ? 'rgba(26, 31, 58, 0.95)'
        : 'rgba(255, 255, 255, 0.95)',
  },
  '&:active': {
    transform: 'translateY(-2px)',
  },
}));

// Account info section
const AccountInfo = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: 1,
});

// Empty state card
const EmptyStateCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6, 3),
  textAlign: 'center',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(3),
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
}));

export const SwitchAccountPage: React.FC = () => {
  const theme = useTheme();
  const { accounts, switchAccount, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSwitchAccount = (address: string) => {
    if (user?.address !== address) {
      switchAccount(address);
    }
  };

  const truncateAddress = (address: string): string => {
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
  };

  if (accounts.length === 0) {
    return (
      <PageContainer>
        <Fade in={isVisible} timeout={600}>
          <ContentWrapper>
            <HeaderSection>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Switch Account
              </Typography>
              <Typography variant="body1" color="text.secondary">
                No accounts found
              </Typography>
            </HeaderSection>

            <EmptyStateCard elevation={0}>
              <PersonOutline
                sx={{
                  fontSize: 64,
                  color: theme.palette.text.secondary,
                  opacity: 0.5,
                  mb: 2,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                You don't have any accounts yet.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please create or import an account first.
              </Typography>
            </EmptyStateCard>
          </ContentWrapper>
        </Fade>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Fade in={isVisible} timeout={600}>
        <ContentWrapper>
          <HeaderSection>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 1,
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Switch Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} available
            </Typography>
          </HeaderSection>

          <Box>
            {accounts.map((account, index) => {
              const isActive = user?.address === account.address;

              return (
                <Slide
                  key={account.address}
                  direction="up"
                  in={isVisible}
                  timeout={700 + index * 100}
                >
                  <AccountCard
                    isActive={isActive}
                    onClick={() => handleSwitchAccount(account.address)}
                    elevation={0}
                    role="button"
                    tabIndex={0}
                    aria-label={`Switch to ${account.name || 'account'}`}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <AccountCircle
                        sx={{
                          fontSize: 48,
                          color: isActive
                            ? theme.palette.primary.main
                            : theme.palette.text.secondary,
                        }}
                      />
                      <AccountInfo>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              fontSize: '1rem',
                            }}
                          >
                            {account.name || 'Unnamed Account'}
                          </Typography>
                          <Chip
                            label={account.userType}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                              color: 'white',
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: '"Roboto Mono", monospace',
                            color: theme.palette.text.secondary,
                            fontSize: '0.875rem',
                          }}
                        >
                          {truncateAddress(account.address)}
                        </Typography>
                      </AccountInfo>
                    </Box>

                    {isActive ? (
                      <Button
                        variant="contained"
                        size="small"
                        disabled
                        startIcon={<CheckCircle />}
                        sx={{
                          background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                          color: 'white',
                          fontWeight: 600,
                          textTransform: 'none',
                          px: 2,
                        }}
                      >
                        Active
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SwapHoriz />}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleSwitchAccount(account.address);
                        }}
                        sx={{
                          fontWeight: 600,
                          textTransform: 'none',
                          px: 2,
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
                        Switch
                      </Button>
                    )}
                  </AccountCard>
                </Slide>
              );
            })}
          </Box>
        </ContentWrapper>
      </Fade>
    </PageContainer>
  );
};

export default SwitchAccountPage;
