/**
 * CubensisConnectImportPage
 *
 * Import flow for the Cubensis Connect browser extension: detect the
 * extension, request permission, then confirm and store the account it
 * reports. Ported from the standalone exchange app's KeeperImportPage, fully
 * renamed and matched against the real CubensisConnectAdapter API surface
 * (getUserList() returns a single-element array of {address, publicKey} —
 * the extension does not expose per-account names).
 */

import { CubensisConnectAdapter } from '@decentralchain/signature-adapter';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExtensionIcon from '@mui/icons-material/Extension';
import InfoIcon from '@mui/icons-material/Info';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Fade,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';

interface CubensisConnectUser {
  address: string;
  publicKey: string;
}

const ErrorCode = {
  LOCKED: 'locked',
  NO_PERMISSION: 1,
  NOT_INSTALLED: 0,
} as const;
type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

const Phase = {
  CONFIRM: 'confirm',
  DETECTING: 'detecting',
  PERMISSION: 'permission',
} as const;
type Phase = (typeof Phase)[keyof typeof Phase];

export const CubensisConnectImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { addCubensisConnectAccount, accounts } = useAuth();
  const { networkByte } = useConfig();
  const [phase, setPhase] = useState<Phase>(Phase.DETECTING);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [user, setUser] = useState<CubensisConnectUser | null>(null);
  const [name, setName] = useState('Cubensis Connect account');
  const [nameError, setNameError] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ message: '', open: false, severity: 'info' });
  const [isVisible, setIsVisible] = useState(false);

  const detect = useCallback(async () => {
    setLoading(true);
    setErrorCode(null);

    try {
      await CubensisConnectAdapter.isAvailable(networkByte);
      setPhase(Phase.PERMISSION);
    } catch (error: unknown) {
      const err = error as { code?: number };
      setErrorCode(err.code === 1 ? ErrorCode.NO_PERMISSION : ErrorCode.NOT_INSTALLED);
    } finally {
      setLoading(false);
    }
  }, [networkByte]);

  useEffect(() => {
    setIsVisible(true);
    void detect();
  }, [detect]);

  useEffect(() => {
    if (user && accounts.some((acc) => acc.address === user.address)) {
      setNameError('This account is already imported');
    } else {
      setNameError('');
    }
  }, [user, accounts]);

  const requestPermission = async () => {
    setLoading(true);
    setErrorCode(null);

    try {
      const [account] = await CubensisConnectAdapter.getUserList();
      if (!account?.address) {
        setErrorCode(ErrorCode.LOCKED);
        return;
      }

      setUser({ address: account.address, publicKey: account.publicKey ?? '' });
      setPhase(Phase.CONFIRM);
      setSnackbar({
        message: 'Connected to Cubensis Connect successfully!',
        open: true,
        severity: 'success',
      });
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err.code === 1) {
        setErrorCode(ErrorCode.NO_PERMISSION);
        setSnackbar({
          message: 'Permission denied. Please approve the connection in Cubensis Connect.',
          open: true,
          severity: 'error',
        });
      } else {
        setSnackbar({
          message: 'Failed to connect to Cubensis Connect',
          open: true,
          severity: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!user || !name || nameError) return;
    setLoading(true);

    try {
      await addCubensisConnectAccount(user, name, networkByte);
      setSnackbar({ message: 'Account imported successfully!', open: true, severity: 'success' });
      setTimeout(() => navigate('/desktop/wallet'), 1000);
    } catch (error) {
      setLoading(false);
      const message = error instanceof Error ? error.message : 'Failed to import account';
      setSnackbar({ message, open: true, severity: 'error' });
    }
  };

  const handleCopyAddress = (address: string) => {
    void navigator.clipboard.writeText(address);
    setSnackbar({ message: 'Address copied to clipboard', open: true, severity: 'success' });
  };

  const handleRetry = () => {
    setErrorCode(null);
    setPhase(Phase.DETECTING);
    void detect();
  };

  return (
    <Fade in={isVisible} timeout={600}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100svh', py: 6 }}>
        <Container maxWidth="sm">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
            Cubensis Connect
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, textAlign: 'center' }}>
            Import your account from the Cubensis Connect browser extension
          </Typography>

          <Paper
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 4 }}
          >
            {phase === Phase.DETECTING && (
              <Box sx={{ textAlign: 'center' }}>
                {errorCode === ErrorCode.NOT_INSTALLED ? (
                  <>
                    <ErrorIcon sx={{ color: 'error.main', fontSize: 64, mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Cubensis Connect Not Found
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                      The Cubensis Connect extension is not installed or not available in your
                      browser.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<ExtensionIcon />}
                      endIcon={<OpenInNewIcon />}
                      href="https://chrome.google.com/webstore/detail/decentralchain-keeper/lpilbniiabackdjcionkobglmddfbcjo?hl=en"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ mb: 2 }}
                    >
                      Install Cubensis Connect
                    </Button>
                    <Box sx={{ mt: 2 }}>
                      <Button variant="outlined" onClick={handleRetry} startIcon={<RefreshIcon />}>
                        Retry Detection
                      </Button>
                      <Button variant="text" onClick={() => navigate('/import')} sx={{ ml: 2 }}>
                        Back to Import Options
                      </Button>
                    </Box>
                  </>
                ) : (
                  <>
                    <Box
                      sx={{
                        alignItems: 'center',
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        color: 'white',
                        display: 'flex',
                        height: 80,
                        justifyContent: 'center',
                        mb: 3,
                        mx: 'auto',
                        width: 80,
                      }}
                    >
                      <ExtensionIcon sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Detecting Cubensis Connect...
                    </Typography>
                    <CircularProgress size={32} />
                  </>
                )}
              </Box>
            )}

            {phase === Phase.PERMISSION && (
              <Box>
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 64, mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Cubensis Connect Detected
                  </Typography>
                </Box>

                <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
                  This application cannot access your private keys or seed phrase. All transactions
                  require your explicit approval in Cubensis Connect.
                </Alert>

                <Accordion sx={{ mb: 3 }} elevation={0} variant="outlined">
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      What permission does this need?
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      <ListItem disablePadding>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Read your wallet address and public key" />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Request transaction signatures — each one still needs your approval in the extension" />
                      </ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>

                {errorCode === ErrorCode.NO_PERMISSION && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    Connection was declined. Click &quot;Connect&quot; and approve the request in
                    Cubensis Connect.
                  </Alert>
                )}
                {errorCode === ErrorCode.LOCKED && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    Cubensis Connect is locked. Please unlock it and try again.
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={requestPermission}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Connect'}
                  </Button>
                  <Button variant="outlined" onClick={() => navigate('/import')} disabled={loading}>
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}

            {phase === Phase.CONFIRM && user && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
                  Confirm Import
                </Typography>

                <Paper
                  elevation={0}
                  sx={{ bgcolor: 'action.hover', borderRadius: 2, mb: 3, p: 2.5 }}
                >
                  <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                    <Grid>
                      <Box
                        sx={{
                          alignItems: 'center',
                          bgcolor: 'primary.main',
                          borderRadius: 1,
                          color: 'white',
                          display: 'flex',
                          height: 48,
                          justifyContent: 'center',
                          width: 48,
                        }}
                      >
                        <AccountBalanceWalletIcon />
                      </Box>
                    </Grid>
                    <Grid size="grow">
                      <Box sx={{ alignItems: 'center', display: 'flex', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {user.address.slice(0, 10)}...{user.address.slice(-10)}
                        </Typography>
                        <Tooltip title="Copy address">
                          <IconButton size="small" onClick={() => handleCopyAddress(user.address)}>
                            <ContentCopyIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Chip label="Cubensis Connect" size="small" sx={{ mt: 0.5 }} />
                    </Grid>
                  </Grid>
                </Paper>

                <TextField
                  fullWidth
                  label="Account Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={!!nameError}
                  helperText={nameError || 'Give this account a name'}
                  disabled={loading}
                  sx={{ mb: 3 }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleImport}
                    disabled={loading || !!nameError || !name}
                  >
                    {loading ? (
                      <CircularProgress size={22} sx={{ color: 'white' }} />
                    ) : (
                      'Import Account'
                    )}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setPhase(Phase.PERMISSION)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Container>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};
