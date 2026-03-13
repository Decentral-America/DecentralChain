import * as signatureAdapter from '@decentralchain/signature-adapter';
import {
  CheckCircle as CheckCircleIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Extension as ExtensionIcon,
  Info as InfoIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Fade,
  Grid,
  Grow,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Slide,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface KeeperUser {
  address: string;
  publicKey: string;
  name?: string;
  network: string;
}

enum KeeperErrorCode {
  NOT_INSTALLED = 0,
  NO_PERMISSION = 1,
  NO_ACCOUNTS = 2,
  WRONG_NETWORK = 3,
  LOCKED = 'locked',
}

enum Phase {
  DETECTING = 'detecting',
  PERMISSION = 'permission',
  ACCOUNTS = 'accounts',
  CONFIRM = 'confirm',
}

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(4),
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1629 100%)'
      : 'linear-gradient(135deg, #f5f7fa 0%, #e8f0fe 50%, #f0f4ff 100%)',
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const FloatingShape = styled(Box)(({ theme }) => ({
  position: 'absolute',
  borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
  background:
    theme.palette.mode === 'dark'
      ? 'radial-gradient(circle, rgba(31, 90, 246, 0.15) 0%, rgba(31, 90, 246, 0) 70%)'
      : 'radial-gradient(circle, rgba(31, 90, 246, 0.1) 0%, rgba(31, 90, 246, 0) 70%)',
  animation: `\${float} 8s ease-in-out infinite`,
  pointerEvents: 'none',
}));

const ContentWrapper = styled(Box)({
  maxWidth: '800px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
});

const MainCard = styled(Paper)(({ theme }) => ({
  background:
    theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(24px)',
  borderRadius: theme.spacing(3),
  padding: theme.spacing(5),
  border: `1px solid \${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 12px 48px rgba(0, 0, 0, 0.5)'
      : '0 12px 48px rgba(0, 0, 0, 0.08)',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

const AccountCard = styled(Paper)<{ selected?: boolean }>(({ theme, selected }) => ({
  background: selected
    ? theme.palette.mode === 'dark'
      ? 'rgba(31, 90, 246, 0.15)'
      : 'rgba(31, 90, 246, 0.08)'
    : theme.palette.mode === 'dark'
      ? 'rgba(26, 31, 58, 0.6)'
      : 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  border: `2px solid \${selected ? theme.palette.primary.main : 'transparent'}`,
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 12px 40px rgba(31, 90, 246, 0.3)'
        : '0 12px 40px rgba(31, 90, 246, 0.2)',
    borderColor: theme.palette.primary.main,
  },
  '&::before': selected
    ? {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        animation: `\${shimmer} 2s infinite`,
      }
    : {},
}));

const IconContainer = styled(Box)(({ theme }) => ({
  width: '100px',
  height: '100px',
  margin: '0 auto',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(31, 90, 246, 0.2) 0%, rgba(90, 129, 255, 0.2) 100%)'
      : 'linear-gradient(135deg, rgba(31, 90, 246, 0.1) 0%, rgba(90, 129, 255, 0.1) 100%)',
  border: `3px solid \${theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.3)' : 'rgba(31, 90, 246, 0.2)'}`,
  animation: `\${pulse} 3s ease-in-out infinite`,
  marginBottom: theme.spacing(3),
}));

const SuccessCheckmark = styled(CheckCircleIcon)(({ theme }) => ({
  fontSize: '100px',
  color: theme.palette.success.main,
  animation: `\${checkmark} 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)`,
}));

export const KeeperImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { addAccount, accounts } = useAuth();
  const [phase, setPhase] = useState<Phase>(Phase.DETECTING);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<KeeperErrorCode | null>(null);
  const [selectedUser, setSelectedUser] = useState<KeeperUser | null>(null);
  const [availableUsers, setAvailableUsers] = useState<KeeperUser[]>([]);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [isVisible, setIsVisible] = useState(false);

  const adapter = signatureAdapter.CubensisConnectAdapter as unknown as {
    isAvailable: () => Promise<boolean>;
    getUserList: () => Promise<KeeperUser[]>;
    type: string;
  };

  const detectKeeper = useCallback(async () => {
    setLoading(true);
    setErrorCode(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate detection time

      const available = await adapter.isAvailable();
      if (!available) {
        setErrorCode(KeeperErrorCode.NOT_INSTALLED);
        setPhase(Phase.DETECTING);
        setLoading(false);
        return;
      }

      // Extension found, move to permission phase
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPhase(Phase.PERMISSION);
      setLoading(false);
    } catch {
      setErrorCode(KeeperErrorCode.NOT_INSTALLED);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsVisible(true);
    detectKeeper();
  }, [detectKeeper]);

  useEffect(() => {
    if (selectedUser) {
      const existingAccount = accounts.find((acc) => acc.address === selectedUser.address);
      if (existingAccount) {
        setNameError('This account is already imported');
      }
    }
  }, [selectedUser, accounts]);

  useEffect(() => {
    if (name && selectedUser) {
      const nameExists = accounts.some(
        (acc) => acc.name === name && acc.address !== selectedUser.address,
      );
      setNameError(nameExists ? 'An account with this name already exists' : '');
    } else if (!name && phase === Phase.CONFIRM) {
      setNameError('Please enter an account name');
    } else {
      setNameError('');
    }
  }, [name, selectedUser, accounts, phase]);

  const requestPermission = async () => {
    setLoading(true);
    setErrorCode(null);

    try {
      const users = await adapter.getUserList();

      if (!users || users.length === 0) {
        setErrorCode(KeeperErrorCode.LOCKED);
        setLoading(false);
        return;
      }

      setAvailableUsers(users as KeeperUser[]);
      setSelectedUser(users[0] as KeeperUser);
      setName((users[0] as KeeperUser).name || 'Keeper Account');
      setPhase(Phase.ACCOUNTS);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Connected to Keeper Wallet successfully!',
        severity: 'success',
      });
    } catch (error: unknown) {
      const err = error as { code?: number | string };
      setLoading(false);

      if (err && typeof err.code !== 'undefined') {
        switch (err.code) {
          case 1:
            setErrorCode(KeeperErrorCode.NO_PERMISSION);
            setSnackbar({
              open: true,
              message: 'Permission denied. Please approve the connection in Keeper.',
              severity: 'error',
            });
            break;
          case 2:
            setErrorCode(KeeperErrorCode.NO_ACCOUNTS);
            break;
          default:
            setErrorCode(KeeperErrorCode.NOT_INSTALLED);
        }
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to connect to Keeper Wallet',
          severity: 'error',
        });
      }
    }
  };

  const handleAccountSelect = (user: KeeperUser) => {
    setSelectedUser(user);
    setName(user.name || 'Keeper Account');
    setPhase(Phase.CONFIRM);
  };

  const handleImport = async () => {
    if (!selectedUser || !name || nameError) return;

    setLoading(true);

    try {
      // Simulate import process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      addAccount(selectedUser.address, name || 'Keeper Account');

      setSnackbar({ open: true, message: 'Account imported successfully!', severity: 'success' });

      setTimeout(() => {
        navigate('/wallet');
      }, 1500);
    } catch {
      setLoading(false);
      setSnackbar({ open: true, message: 'Failed to import account', severity: 'error' });
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setSnackbar({ open: true, message: 'Address copied to clipboard', severity: 'success' });
  };

  const handleRetry = () => {
    setErrorCode(null);
    setPhase(Phase.DETECTING);
    detectKeeper();
  };

  // Render phase: DETECTING
  if (phase === Phase.DETECTING) {
    return (
      <Fade in={isVisible} timeout={600}>
        <PageContainer>
          <FloatingShape sx={{ width: '500px', height: '500px', top: '-150px', left: '-100px' }} />
          <FloatingShape
            sx={{
              width: '400px',
              height: '400px',
              bottom: '-100px',
              right: '-100px',
              animationDelay: '2s',
            }}
          />
          <FloatingShape
            sx={{ width: '300px', height: '300px', top: '50%', right: '10%', animationDelay: '4s' }}
          />

          <ContentWrapper>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 1,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', sm: '2.5rem' },
              }}
            >
              Import from Keeper Wallet
            </Typography>

            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                mb: 5,
                px: 2,
              }}
            >
              Connect your Keeper browser extension to import your account
            </Typography>

            <MainCard>
              {errorCode === KeeperErrorCode.NOT_INSTALLED ? (
                <Grow in timeout={800}>
                  <Box sx={{ textAlign: 'center' }}>
                    <ErrorIcon sx={{ fontSize: '80px', color: 'error.main', mb: 3 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                      Keeper Wallet Not Found
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                      The Keeper Wallet extension is not installed or not available in your browser.
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<ExtensionIcon />}
                      endIcon={<OpenInNewIcon />}
                      href="https://keeper-wallet.app/"
                      target="_blank"
                      sx={{
                        background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                        mb: 2,
                      }}
                    >
                      Install Keeper Wallet
                    </Button>
                    <Box sx={{ mt: 3 }}>
                      <Button variant="outlined" onClick={handleRetry} startIcon={<RefreshIcon />}>
                        Retry Detection
                      </Button>
                      <Button variant="text" onClick={() => navigate('/import')} sx={{ ml: 2 }}>
                        Back to Import Options
                      </Button>
                    </Box>
                  </Box>
                </Grow>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <IconContainer>
                    <ExtensionIcon sx={{ fontSize: '50px', color: 'primary.main' }} />
                  </IconContainer>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Detecting Keeper Wallet...
                  </Typography>
                  <CircularProgress size={40} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
                    Please wait while we check for the extension
                  </Typography>
                </Box>
              )}
            </MainCard>
          </ContentWrapper>
        </PageContainer>
      </Fade>
    );
  }

  // Render phase: PERMISSION
  if (phase === Phase.PERMISSION) {
    return (
      <Slide in direction="left" timeout={500}>
        <PageContainer>
          <FloatingShape sx={{ width: '500px', height: '500px', top: '-150px', left: '-100px' }} />
          <FloatingShape
            sx={{
              width: '400px',
              height: '400px',
              bottom: '-100px',
              right: '-100px',
              animationDelay: '2s',
            }}
          />

          <ContentWrapper>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 1,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', sm: '2.5rem' },
              }}
            >
              Connect Keeper Wallet
            </Typography>

            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                mb: 5,
              }}
            >
              Grant permission to access your Keeper accounts
            </Typography>

            <MainCard>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <SuccessCheckmark />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main', mt: 2 }}>
                  Keeper Wallet Detected!
                </Typography>
              </Box>

              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(31, 90, 246, 0.1)'
                      : 'rgba(31, 90, 246, 0.05)',
                  border: (_theme) => `1px solid \${_theme.palette.primary.main}30`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <SecurityIcon sx={{ fontSize: '32px', color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Permission Request
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  This application needs permission to:
                </Typography>

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Read your wallet addresses"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Request transaction signatures (requires your approval)"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Access public account data"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>
              </Paper>

              <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
                <strong>Privacy Note:</strong> This application cannot access your private keys or
                seed phrase. All transactions require your explicit approval in Keeper Wallet.
              </Alert>

              <Accordion sx={{ mb: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Why do we need these permissions?
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    <strong>Wallet Addresses:</strong> Required to display your account information
                    and transaction history.
                    <br />
                    <br />
                    <strong>Transaction Signatures:</strong> Allows you to send transactions, but
                    each one must be approved by you in the Keeper extension.
                    <br />
                    <br />
                    <strong>Public Data:</strong> Enables us to show your balance, tokens, and
                    transaction history without accessing private information.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {errorCode === KeeperErrorCode.NO_PERMISSION && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  Connection was declined. Please click &quot;Connect&quot; and approve the request
                  in Keeper Wallet.
                </Alert>
              )}

              {errorCode === KeeperErrorCode.LOCKED && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  Keeper Wallet is locked. Please unlock it and try again.
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={requestPermission}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                    boxShadow: '0 4px 16px rgba(31, 90, 246, 0.3)',
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                      Connecting...
                    </>
                  ) : (
                    'Connect Keeper'
                  )}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/import')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Box>
            </MainCard>
          </ContentWrapper>
        </PageContainer>
      </Slide>
    );
  }

  // Render phase: ACCOUNTS
  if (phase === Phase.ACCOUNTS) {
    return (
      <Slide in direction="left" timeout={500}>
        <PageContainer>
          <FloatingShape sx={{ width: '500px', height: '500px', top: '-150px', left: '-100px' }} />
          <FloatingShape
            sx={{
              width: '400px',
              height: '400px',
              bottom: '-100px',
              right: '-100px',
              animationDelay: '2s',
            }}
          />

          <ContentWrapper>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 1,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', sm: '2.5rem' },
              }}
            >
              Select Account
            </Typography>

            <Typography
              variant="body1"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                mb: 5,
              }}
            >
              Choose which account you want to import
            </Typography>

            <MainCard>
              <Grid container spacing={3}>
                {availableUsers.map((user) => (
                  <Grid key={user.address} size={12}>
                    <Grow in timeout={600}>
                      <AccountCard
                        selected={selectedUser?.address === user.address}
                        onClick={() => handleAccountSelect(user)}
                      >
                        {selectedUser?.address === user.address && (
                          <Chip
                            label="Selected"
                            size="small"
                            icon={<CheckCircleIcon />}
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                              color: 'white',
                            }}
                          />
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Box
                            sx={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <WalletIcon sx={{ fontSize: '32px', color: 'white' }} />
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {user.name || 'Keeper Account'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  color: 'text.secondary',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {user.address.slice(0, 10)}...{user.address.slice(-10)}
                              </Typography>
                              <Tooltip title="Copy address">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyAddress(user.address);
                                  }}
                                >
                                  <CopyIcon sx={{ fontSize: '16px' }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                            <Chip label={user.network || 'mainnet'} size="small" sx={{ mt: 1 }} />
                          </Box>
                        </Box>
                      </AccountCard>
                    </Grow>
                  </Grid>
                ))}
              </Grid>

              {availableUsers.length === 0 && (
                <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
                  No accounts found in Keeper Wallet. Please create an account first.
                </Alert>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <Button variant="outlined" size="large" onClick={() => setPhase(Phase.PERMISSION)}>
                  Back
                </Button>
              </Box>
            </MainCard>
          </ContentWrapper>
        </PageContainer>
      </Slide>
    );
  }

  // Render phase: CONFIRM
  return (
    <Slide in direction="left" timeout={500}>
      <PageContainer>
        <FloatingShape sx={{ width: '500px', height: '500px', top: '-150px', left: '-100px' }} />
        <FloatingShape
          sx={{
            width: '400px',
            height: '400px',
            bottom: '-100px',
            right: '-100px',
            animationDelay: '2s',
          }}
        />

        <ContentWrapper>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 1,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2rem', sm: '2.5rem' },
            }}
          >
            Confirm Import
          </Typography>

          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              mb: 5,
            }}
          >
            Review your account details and complete the import
          </Typography>

          <MainCard>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(31, 90, 246, 0.1)'
                    : 'rgba(31, 90, 246, 0.05)',
                border: (_theme) => `1px solid \${_theme.palette.primary.main}30`,
              }}
            >
              <Typography
                variant="overline"
                sx={{ color: 'text.secondary', mb: 2, display: 'block' }}
              >
                Selected Account
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WalletIcon sx={{ fontSize: '24px', color: 'white' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {selectedUser?.name || 'Keeper Account'}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                  >
                    {selectedUser?.address}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <TextField
              fullWidth
              label="Account Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!nameError}
              helperText={nameError || 'Give this account a friendly name'}
              disabled={loading}
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <Tooltip title="Edit name">
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            />

            {accounts.find((acc) => acc.address === selectedUser?.address) && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
                This account is already imported. Importing again will create a duplicate.
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleImport}
                disabled={loading || !!nameError || !name}
                sx={{
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                  boxShadow: '0 4px 16px rgba(31, 90, 246, 0.3)',
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                    Importing...
                  </>
                ) : (
                  'Import Account'
                )}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => setPhase(Phase.ACCOUNTS)}
                disabled={loading}
              >
                Back
              </Button>
            </Box>
          </MainCard>
        </ContentWrapper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </PageContainer>
    </Slide>
  );
};

export default KeeperImportPage;
