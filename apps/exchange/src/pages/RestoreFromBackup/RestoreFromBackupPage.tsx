/**
 * RestoreFromBackup Page
 * Restores wallet from encrypted backup file
 * Matches Angular fromBackup/restore module functionality
 */

import {
  AccountCircle,
  CheckCircle,
  CloudUpload,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Container,
  Fade,
  keyframes,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Slide,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

// Animations
const gradientShift = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

// Styled Components
const PageContainer = styled(Box)(({ theme }) => ({
  alignItems: 'center',
  animation: `${gradientShift} 15s ease infinite`,
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)'
      : 'linear-gradient(135deg, #e8f0fe 0%, #f5f7fa 50%, #e3f2fd 100%)',
  backgroundSize: '200% 200%',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100vh',
  overflow: 'hidden',
  padding: theme.spacing(3),
  position: 'relative',
}));

const FloatingShape = styled(Box, {
  shouldForwardProp: (prop) => !['delay', 'size', 'top', 'left'].includes(prop as string),
})<{ delay: number; size: number; top: string; left: string }>(
  ({ theme, delay, size, top, left }) => ({
    animation: `${float} ${6 + delay}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    backdropFilter: 'blur(10px)',
    background:
      theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.08)' : 'rgba(31, 90, 246, 0.04)',
    borderRadius: '30%',
    height: size,
    left,
    position: 'absolute',
    top,
    width: size,
    zIndex: 0,
  }),
);

const GlowOrb = styled(Box, {
  shouldForwardProp: (prop) => !['color', 'top', 'left', 'size'].includes(prop as string),
})<{ color: string; top: string; left: string; size: number }>(({ color, top, left, size }) => ({
  animation: `${pulse} 4s ease-in-out infinite`,
  background: `radial-gradient(circle, ${color}30 0%, ${color}00 70%)`,
  borderRadius: '50%',
  filter: 'blur(40px)',
  height: size,
  left,
  position: 'absolute',
  top,
  width: size,
  zIndex: 0,
}));

const ContentWrapper = styled(Container)(({ theme }) => ({
  backdropFilter: 'blur(24px)',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  border: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  }`,
  borderRadius: theme.spacing(3),
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 12px 40px rgba(0, 0, 0, 0.5)'
      : '0 12px 40px rgba(0, 0, 0, 0.1)',
  maxWidth: '700px !important',
  padding: theme.spacing(5),
  position: 'relative',
  zIndex: 1,
}));

const DropZone = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isDragActive',
})<{ isDragActive?: boolean }>(({ theme, isDragActive }) => ({
  '&:hover': {
    background:
      theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.08)' : 'rgba(31, 90, 246, 0.03)',
    borderColor: theme.palette.primary.main,
  },
  background: isDragActive
    ? theme.palette.mode === 'dark'
      ? 'rgba(31, 90, 246, 0.1)'
      : 'rgba(31, 90, 246, 0.05)'
    : 'transparent',
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  cursor: 'pointer',
  padding: theme.spacing(6),
  textAlign: 'center',
  transition: 'all 0.3s ease',
}));

interface WalletBackup {
  version: string;
  encrypted: boolean;
  timestamp: number;
  data: {
    accounts: Array<{
      address: string;
      publicKey: string;
      encryptedSeed: string;
      name?: string;
      userType: 'seed' | 'privateKey' | 'ledger' | 'keeper';
    }>;
    settings?: Record<string, unknown>;
    checksum: string;
  };
}

const steps = ['Upload Backup', 'Enter Password', 'Restore Accounts'];

function mergeAccounts(incoming: Array<{ address: string; [key: string]: unknown }>): {
  merged: unknown[];
  newCount: number;
} {
  const existing = JSON.parse(localStorage.getItem('dcc_users') || '[]') as unknown[];
  const merged = [...existing];
  let newCount = 0;
  for (const account of incoming) {
    if (!merged.some((a: unknown) => (a as { address: string }).address === account.address)) {
      merged.push(account);
      newCount++;
    }
  }
  return { merged, newCount };
}

export const RestoreFromBackupPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { getActiveState } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  // State
  const [activeStep, setActiveStep] = useState(0);
  const [, setBackupFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<WalletBackup | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [restoredAccounts, setRestoredAccounts] = useState<number>(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setError('');

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setError('Invalid file type. Please select a JSON backup file.');
      return;
    }

    try {
      const content = await file.text();
      const backup: WalletBackup = JSON.parse(content);

      // Validate backup structure
      if (!backup.version || !backup.data || !backup.data.accounts) {
        throw new Error('Invalid backup file structure');
      }

      setBackupFile(file);
      setBackupData(backup);
      setActiveStep(1);
    } catch (err) {
      setError('Invalid backup file. Please check the file and try again.');
      logger.error('Backup parse error:', err);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && files[0]) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const decryptBackup = async (encryptedData: string, password: string): Promise<unknown> => {
    try {
      // This should match Angular's decryption exactly
      // Using crypto.subtle with PBKDF2 + AES-GCM (same as Angular)
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // Derive key from password
      const passwordBuffer = encoder.encode(password);
      const keyMaterial = await crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, [
        'deriveKey',
      ]);

      const key = await crypto.subtle.deriveKey(
        {
          hash: 'SHA-256',
          iterations: 100000,
          name: 'PBKDF2',
          salt: encoder.encode('dcc-salt'), // Must match Angular
        },
        keyMaterial,
        { length: 256, name: 'AES-GCM' },
        false,
        ['decrypt'],
      );

      // Decrypt data
      const encryptedBuffer = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
      const iv = encryptedBuffer.slice(0, 12);
      const encrypted = encryptedBuffer.slice(12);

      const decrypted = await crypto.subtle.decrypt({ iv, name: 'AES-GCM' }, key, encrypted);

      return JSON.parse(decoder.decode(decrypted));
    } catch {
      throw new Error('Decryption failed. Please check your password.');
    }
  };

  const handleRestore = async () => {
    if (!backupData || !password) return;

    setIsProcessing(true);
    setError('');

    try {
      let accountsData = backupData.data.accounts;
      if (backupData.encrypted) {
        const decryptedData = await decryptBackup(JSON.stringify(backupData.data), password);
        accountsData = (decryptedData as { accounts: typeof accountsData }).accounts;
      }

      const { merged, newCount } = mergeAccounts(accountsData);
      localStorage.setItem('dcc_users', JSON.stringify(merged));
      if (backupData.data.settings)
        localStorage.setItem('dcc_settings', JSON.stringify(backupData.data.settings));

      setRestoredAccounts(newCount);
      setActiveStep(2);
      setTimeout(() => navigate(getActiveState('wallet')), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore backup';
      setError(errorMessage);
      logger.error('Restore error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () =>
    [
      () => (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Upload Backup File
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Select your wallet backup file (.json)
          </Typography>

          <input
            type="file"
            accept=".json"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            id="backup-file-input"
          />

          <label htmlFor="backup-file-input">
            <DropZone
              isDragActive={isDragActive}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              elevation={0}
            >
              <CloudUpload
                sx={{
                  color: isDragActive ? 'primary.main' : 'text.secondary',
                  fontSize: 64,
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {isDragActive ? 'Drop backup file here' : 'Drag & drop your backup file'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to browse files
              </Typography>
              <Button variant="secondary" component="span">
                Select Backup File
              </Button>
            </DropZone>
          </label>

          <Alert severity="info" sx={{ mt: 3 }}>
            <AlertTitle>Backup File Location</AlertTitle>
            Your backup file is named something like{' '}
            <code>dcc-exchange-backup-2025-10-17.json</code>. It was created when you exported your
            wallet from Settings.
          </Alert>
        </Box>
      ),
      () => (
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Enter Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {backupData?.encrypted
              ? 'Enter the password used to encrypt this backup'
              : 'Backup file is not encrypted'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {backupData && (
            <Paper
              sx={{
                background:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${theme.palette.divider}`,
                mb: 3,
                p: 2.5,
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Backup Information
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Version:</strong> {backupData.version}
              </Typography>
              <Typography variant="body2">
                <strong>Accounts:</strong> {backupData.data.accounts.length}
              </Typography>
              <Typography variant="body2">
                <strong>Encrypted:</strong> {backupData.encrypted ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {new Date(backupData.timestamp).toLocaleString()}
              </Typography>
            </Paper>
          )}

          {backupData?.encrypted && (
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Backup Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter backup password"
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <Box
                    sx={{ alignItems: 'center', cursor: 'pointer', display: 'flex' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </Box>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && password) {
                  handleRestore();
                }
              }}
            />
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="secondary" onClick={() => setActiveStep(0)} fullWidth>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleRestore}
              disabled={backupData?.encrypted && !password}
              fullWidth
            >
              {isProcessing ? 'Restoring...' : 'Restore Wallet'}
            </Button>
          </Box>

          {isProcessing && <LinearProgress sx={{ mt: 2 }} />}
        </Box>
      ),
      () => (
        <Box sx={{ textAlign: 'center' }}>
          <CheckCircle
            sx={{
              color: 'success.main',
              fontSize: 80,
              mb: 3,
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Wallet Restored Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {restoredAccounts} account{restoredAccounts !== 1 ? 's' : ''} restored from backup
          </Typography>

          {backupData && backupData.data.accounts.length > 0 && (
            <Paper
              sx={{
                background:
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.02)',
                mb: 3,
                p: 2,
                textAlign: 'left',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Restored Accounts:
              </Typography>
              <List dense>
                {backupData.data.accounts.slice(0, 5).map((account) => (
                  <ListItem key={account.address} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AccountCircle fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={account.name || 'Unnamed Account'}
                      secondary={`${account.address.slice(0, 12)}...${account.address.slice(-8)}`}
                      primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
                {backupData.data.accounts.length > 5 && (
                  <ListItem>
                    <ListItemText
                      primary={`... and ${backupData.data.accounts.length - 5} more`}
                      primaryTypographyProps={{ color: 'text.secondary', variant: 'caption' }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Redirecting to wallet in 3 seconds...
          </Typography>

          <Button
            variant="primary"
            onClick={() => {
              const targetRoute = getActiveState('wallet');
              navigate(targetRoute);
            }}
            fullWidth
          >
            Go to Wallet
          </Button>
        </Box>
      ),
    ][activeStep]?.() ?? null;

  return (
    <PageContainer>
      <FloatingShape delay={0} size={200} top="10%" left="5%" />
      <FloatingShape delay={1.5} size={150} top="65%" left="80%" />
      <FloatingShape delay={2.5} size={180} top="75%" left="10%" />

      <GlowOrb
        color={theme.palette.mode === 'dark' ? '#1f5af6' : '#5a81ff'}
        top="20%"
        left="15%"
        size={350}
      />
      <GlowOrb
        color={theme.palette.mode === 'dark' ? '#5a81ff' : '#1f5af6'}
        top="65%"
        left="70%"
        size={400}
      />

      <Fade in={isVisible} timeout={600}>
        <Slide direction="up" in={isVisible} timeout={800}>
          <ContentWrapper>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography
                variant="h4"
                sx={{
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
                  fontWeight: 800,
                  mb: 1,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Restore from Backup
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Import your wallet from an encrypted backup file
              </Typography>
            </Box>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && activeStep === 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {renderStepContent()}

            {activeStep === 0 && (
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don&apos;t have a backup?{' '}
                  <Button
                    variant="text"
                    onClick={() => navigate('/signin')}
                    sx={{ fontWeight: 600, textTransform: 'none' }}
                  >
                    Sign in with seed phrase
                  </Button>
                </Typography>
              </Box>
            )}
          </ContentWrapper>
        </Slide>
      </Fade>
    </PageContainer>
  );
};
