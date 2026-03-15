import { AccountCircle, CheckCircle, PersonOutline, SwapHoriz } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Container,
  Fade,
  Paper,
  Slide,
  styled,
  Typography,
  useTheme,
} from '@mui/material';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * SwitchAccountPage Component
 *
 * Modern account switcher with glassmorphic cards
 */

// Container with gradient background
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
  '&:active': {
    transform: 'translateY(-2px)',
  },
  '&:hover': {
    background: isActive
      ? theme.palette.mode === 'dark'
        ? 'rgba(31, 90, 246, 0.2)'
        : 'rgba(31, 90, 246, 0.12)'
      : theme.palette.mode === 'dark'
        ? 'rgba(26, 31, 58, 0.95)'
        : 'rgba(255, 255, 255, 0.95)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 12px 32px rgba(0, 0, 0, 0.5)'
        : '0 12px 32px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-4px)',
  },
  alignItems: 'center',
  backdropFilter: 'blur(20px)',
  background: isActive
    ? theme.palette.mode === 'dark'
      ? 'rgba(31, 90, 246, 0.15)'
      : 'rgba(31, 90, 246, 0.08)'
    : theme.palette.mode === 'dark'
      ? 'rgba(26, 31, 58, 0.9)'
      : 'rgba(255, 255, 255, 0.9)',
  border: isActive
    ? `2px solid ${theme.palette.primary.main}`
    : `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  borderRadius: theme.spacing(2),
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 8px 24px rgba(0, 0, 0, 0.4)'
      : '0 8px 24px rgba(0, 0, 0, 0.06)',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2.5),
  transition: 'all 0.3s ease',
}));

// Account info section
const AccountInfo = styled(Box)({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: 4,
});

// Empty state card
const EmptyStateCard = styled(Paper)(({ theme }) => ({
  backdropFilter: 'blur(20px)',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(6, 3),
  textAlign: 'center',
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
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                  fontWeight: 800,
                  mb: 1,
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
                  color: theme.palette.text.secondary,
                  fontSize: 64,
                  mb: 2,
                  opacity: 0.5,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                You don&apos;t have any accounts yet.
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
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                fontWeight: 800,
                mb: 1,
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
                    <Box sx={{ alignItems: 'center', display: 'flex', flex: 1, gap: 2 }}>
                      <AccountCircle
                        sx={{
                          color: isActive
                            ? theme.palette.primary.main
                            : theme.palette.text.secondary,
                          fontSize: 48,
                        }}
                      />
                      <AccountInfo>
                        <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontSize: '1rem',
                              fontWeight: 600,
                            }}
                          >
                            {account.name || 'Unnamed Account'}
                          </Typography>
                          <Chip
                            label={account.userType}
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                              color: 'white',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              height: 20,
                              textTransform: 'uppercase',
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontFamily: '"Roboto Mono", monospace',
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
                          px: 2,
                          textTransform: 'none',
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
                          '&:hover': {
                            background:
                              theme.palette.mode === 'dark'
                                ? 'rgba(31, 90, 246, 0.1)'
                                : 'rgba(31, 90, 246, 0.05)',
                            borderWidth: 2,
                          },
                          borderWidth: 2,
                          fontWeight: 600,
                          px: 2,
                          textTransform: 'none',
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
