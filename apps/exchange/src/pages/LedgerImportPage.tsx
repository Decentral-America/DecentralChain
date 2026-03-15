/**
 * LedgerImportPage Component
 * Step-by-step hardware wallet connection flow with Material-UI
 */

import { LedgerAdapter } from '@decentralchain/signature-adapter';
import {
  AccountCircle as AccountCircleIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ContentCopy as CopyIcon,
  Smartphone as SmartphoneIcon,
  Usb as UsbIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Step as MuiStep,
  Paper,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { useAuth } from '../contexts/AuthContext';

const USERS_COUNT = 5;
const CONFIRMATION_TIMEOUT = 60000; // 60 seconds

interface LedgerUser {
  id: number;
  path: string;
  address: string;
  publicKey: string;
}

enum Step {
  CONNECT_DEVICE = 0,
  OPEN_APP = 1,
  SELECT_ACCOUNT = 2,
  CONFIRM = 3,
}
// Animations
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: theme.spacing(4),
}));

const ContentCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  maxWidth: 800,
  padding: theme.spacing(4),
  width: '100%',
}));

const PulsingIcon = styled(Box)({
  animation: `${pulse} 2s ease-in-out infinite`,
});

const ShimmerIcon = styled(Box)({
  animation: `${shimmer} 2s infinite`,
  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
  backgroundSize: '1000px 100%',
  borderRadius: '50%',
});

export const LedgerImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { accounts } = useAuth();
  const [activeStep, setActiveStep] = useState(Step.CONNECT_DEVICE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Record<number, LedgerUser>>({});
  const [selectedUser, setSelectedUser] = useState<LedgerUser | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [accountName, setAccountName] = useState('');
  const [confirmationStartTime, setConfirmationStartTime] = useState<number | null>(null);
  const [timeoutWarning, setTimeoutWarning] = useState(false);

  const adapter = LedgerAdapter;
  const steps = ['Connect Device', 'Open App', 'Select Account', 'Confirm'];

  const connectDevice = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check WebUSB compatibility
      const nav = navigator as Navigator & { usb?: unknown };
      if (!nav.usb) {
        throw new Error('WebUSB is not supported in this browser. Please use Chrome or Edge.');
      }

      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate detection
      setActiveStep(Step.OPEN_APP);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to device');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-progress from Connect to Open App
  useEffect(() => {
    if (activeStep === Step.CONNECT_DEVICE) {
      connectDevice();
    }
  }, [activeStep, connectDevice]);

  // Timeout warning for confirmation step
  useEffect(() => {
    if (activeStep === Step.CONFIRM && confirmationStartTime) {
      const timer = setTimeout(() => {
        setTimeoutWarning(true);
      }, CONFIRMATION_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [activeStep, confirmationStartTime]);

  const loadAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const userList = await Promise.race([
        adapter.getUserList(0, USERS_COUNT - 1),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timeout - please check your device')),
            25000,
          ),
        ),
      ]);

      const newUsers: Record<number, LedgerUser> = {};
      const userArray = (userList || []) as LedgerUser[];
      for (const user of userArray) {
        newUsers[user.id] = user;
      }
      setUsers(newUsers);

      if (userArray.length > 0) {
        const firstUser = userArray[0];
        if (firstUser) {
          setSelectedUser(firstUser);
          setAccountName(`Ledger ${firstUser.id}`);
        }
        setActiveStep(Step.SELECT_ACCOUNT);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = (user: LedgerUser) => {
    setSelectedUser(user);
    setAccountName(`Ledger ${user.id}`);
  };

  const handleNext = () => {
    if (activeStep === Step.OPEN_APP) {
      loadAccounts();
    } else if (activeStep === Step.SELECT_ACCOUNT && selectedUser) {
      setActiveStep(Step.CONFIRM);
      setConfirmationStartTime(Date.now());
      // Simulate device confirmation
      setTimeout(() => handleImport(), 2000);
    }
  };

  const handleImport = async () => {
    if (!selectedUser || !accountName) return;

    try {
      setLoading(true);

      // Check if address already exists
      const existingAccount = accounts.find((acc) => acc.address === selectedUser.address);
      if (existingAccount) {
        throw new Error('This address is already saved in your wallet');
      }

      // Check if name already exists
      const nameExists = accounts.some((acc) => acc.name === accountName);
      if (nameExists) {
        throw new Error('An account with this name already exists');
      }

      // For Ledger accounts, we need to implement proper hardware wallet support
      // For now, show a message that this feature is coming soon
      // TODO: Implement proper Ledger account support in AuthContext
      // await addAccount(ledgerSignature, accountName);

      throw new Error(
        'Ledger hardware wallet support is coming soon. Please use seed phrase or password authentication for now.',
      );

      // navigate('/desktop/wallet');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import account');
      setActiveStep(Step.SELECT_ACCOUNT);
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep === Step.SELECT_ACCOUNT) {
      setActiveStep(Step.OPEN_APP);
    } else if (activeStep === Step.CONFIRM) {
      setActiveStep(Step.SELECT_ACCOUNT);
      setTimeoutWarning(false);
      setConfirmationStartTime(null);
    }
  };

  const handleRestart = () => {
    setActiveStep(Step.CONNECT_DEVICE);
    setError(null);
    setUsers({});
    setSelectedUser(null);
    setAccountName('');
    setTimeoutWarning(false);
    setConfirmationStartTime(null);
  };

  const visibleUsers = Object.values(users).slice(carouselIndex, carouselIndex + 5);

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch (err) {
      logger.error('Failed to copy address:', err);
    }
  };

  return (
    <PageContainer>
      <ContentCard elevation={3}>
        <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
          Import from Ledger
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" mb={4}>
          Connect your hardware wallet to import an account
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <MuiStep key={label}>
              <StepLabel>{label}</StepLabel>
            </MuiStep>
          ))}
        </Stepper>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleRestart}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Step 1: Connect Device */}
        {activeStep === Step.CONNECT_DEVICE && (
          <Box textAlign="center" py={4}>
            <PulsingIcon mb={3}>
              <UsbIcon sx={{ color: 'primary.main', fontSize: 80 }} />
            </PulsingIcon>
            <Typography variant="h6" gutterBottom>
              Connect Your Ledger Device
            </Typography>
            <List sx={{ maxWidth: 400, mb: 3, mx: 'auto' }}>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Connect your Ledger device via USB" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Enter your PIN on the device" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Wait for connection confirmation" />
              </ListItem>
            </List>
            {loading && (
              <>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Detecting device...
                </Typography>
                <LinearProgress />
              </>
            )}
          </Box>
        )}

        {/* Step 2: Open App */}
        {activeStep === Step.OPEN_APP && (
          <Box textAlign="center" py={4}>
            <ShimmerIcon mb={3}>
              <SmartphoneIcon sx={{ color: 'primary.main', fontSize: 80 }} />
            </ShimmerIcon>
            <Typography variant="h6" gutterBottom>
              Open the DCC App
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              On your Ledger device, navigate to and open the DCC application
            </Typography>
            <List sx={{ maxWidth: 400, mb: 3, mx: 'auto' }}>
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="App initialized" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  {loading ? <CircularProgress size={24} /> : <CheckCircleIcon color="success" />}
                </ListItemIcon>
                <ListItemText primary="Loading accounts..." />
              </ListItem>
            </List>
            <Button
              variant="contained"
              size="large"
              onClick={handleNext}
              disabled={loading}
              fullWidth
              sx={{ maxWidth: 300 }}
            >
              {loading ? 'Loading...' : 'Continue'}
            </Button>
          </Box>
        )}

        {/* Step 3: Select Account */}
        {activeStep === Step.SELECT_ACCOUNT && (
          <Box py={2}>
            <Typography variant="h6" gutterBottom textAlign="center">
              Select Account
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
              Choose which account to import
            </Typography>

            {/* Account Carousel */}
            <Box position="relative" mb={4}>
              <Box
                display="flex"
                gap={2}
                justifyContent="center"
                alignItems="center"
                minHeight={200}
              >
                {visibleUsers.map((user) => (
                  <Card
                    key={user.id}
                    onClick={() => handleAccountSelect(user)}
                    sx={{
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-4px)',
                      },
                      border: selectedUser?.id === user.id ? 2 : 1,
                      borderColor: selectedUser?.id === user.id ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      width: 140,
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center' }}>
                      <Avatar
                        sx={{
                          background:
                            selectedUser?.id === user.id
                              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              : undefined,
                          bgcolor: selectedUser?.id === user.id ? 'primary.main' : 'grey.300',
                          height: 60,
                          mb: 1,
                          mx: 'auto',
                          width: 60,
                        }}
                      >
                        <AccountCircleIcon fontSize="large" />
                      </Avatar>
                      <Typography variant="caption" display="block" fontWeight="bold">
                        Account {user.id}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                        sx={{ fontFamily: 'monospace', fontSize: 10 }}
                      >
                        {user.path}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Navigation arrows */}
              <Box
                display="flex"
                justifyContent="space-between"
                position="absolute"
                top="50%"
                left={-20}
                right={-20}
                sx={{ pointerEvents: 'none', transform: 'translateY(-50%)' }}
              >
                <IconButton
                  onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
                  disabled={carouselIndex === 0}
                  sx={{ pointerEvents: 'all' }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  onClick={() => setCarouselIndex(carouselIndex + 1)}
                  disabled={carouselIndex + 5 >= Object.keys(users).length}
                  sx={{ pointerEvents: 'all' }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Box>

            {selectedUser && (
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Address
                </Typography>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  p={2}
                  bgcolor="grey.100"
                  borderRadius={1}
                  sx={{ fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all' }}
                >
                  <Typography variant="body2" flex={1} sx={{ fontFamily: 'monospace' }}>
                    {selectedUser.address}
                  </Typography>
                  <Tooltip title="Copy address">
                    <IconButton size="small" onClick={() => copyAddress(selectedUser.address)}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}

            <TextField
              fullWidth
              label="Account Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Enter a name for this account"
              margin="normal"
              helperText="Give your account a memorable name"
            />

            <Box display="flex" gap={2} mt={3}>
              <Button variant="outlined" onClick={handleBack} fullWidth>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!selectedUser || !accountName}
                fullWidth
              >
                Continue
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 4: Confirm */}
        {activeStep === Step.CONFIRM && (
          <Box textAlign="center" py={4}>
            <Box mb={3}>
              <AccountCircleIcon sx={{ color: 'primary.main', fontSize: 80 }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              Confirm on Your Ledger
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Please confirm the account import on your Ledger device
            </Typography>

            {selectedUser && (
              <Paper variant="outlined" sx={{ maxWidth: 500, mb: 3, mx: 'auto', p: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Account: {accountName}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                >
                  {selectedUser.address}
                </Typography>
              </Paper>
            )}

            {timeoutWarning && (
              <Alert severity="warning" sx={{ maxWidth: 500, mb: 2, mx: 'auto' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <WarningIcon />
                  <Typography variant="body2">
                    Taking longer than expected. Please check your device.
                  </Typography>
                </Box>
              </Alert>
            )}

            <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Waiting for confirmation...
              </Typography>
            </Box>

            <Button
              variant="text"
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
              sx={{ mt: 3 }}
            >
              Go Back
            </Button>
          </Box>
        )}

        {/* Bottom navigation */}
        <Box mt={4} textAlign="center">
          <Button
            variant="text"
            onClick={() => navigate('/auth/import')}
            startIcon={<ArrowBackIcon />}
          >
            Back to Import Options
          </Button>
        </Box>
      </ContentCard>
    </PageContainer>
  );
};
