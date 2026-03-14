/**
 * RestoreFromBackup Page
 * Restores wallet from encrypted backup file
 * Matches Angular fromBackup/restore module functionality
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Paper,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Slide,
  useTheme,
  keyframes,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  CloudUpload,
  CheckCircle,
  AccountCircle,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Button } from '@/components/atoms/Button';
import { useAuth } from '@/contexts/AuthContext';

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
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)'
      : 'linear-gradient(135deg, #e8f0fe 0%, #f5f7fa 50%, #e3f2fd 100%)',
  backgroundSize: '200% 200%',
  animation: `${gradientShift} 15s ease infinite`,
  padding: theme.spacing(3),
}));

const FloatingShape = styled(Box, {
  shouldForwardProp: (prop) => !['delay', 'size', 'top', 'left'].includes(prop as string),
})<{ delay: number; size: number; top: string; left: string }>(
  ({ theme, delay, size, top, left }) => ({
    position: 'absolute',
    width: size,
    height: size,
    top,
    left,
    borderRadius: '30%',
    background:
      theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.08)' : 'rgba(31, 90, 246, 0.04)',
    backdropFilter: 'blur(10px)',
    animation: `${float} ${6 + delay}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    zIndex: 0,
  })
);

const GlowOrb = styled(Box, {
  shouldForwardProp: (prop) => !['color', 'top', 'left', 'size'].includes(prop as string),
})<{ color: string; top: string; left: string; size: number }>(({ color, top, left, size }) => ({
  position: 'absolute',
  width: size,
  height: size,
  top,
  left,
  borderRadius: '50%',
  background: `radial-gradient(circle, ${color}30 0%, ${color}00 70%)`,
  filter: 'blur(40px)',
  animation: `${pulse} 4s ease-in-out infinite`,
  zIndex: 0,
}));

const ContentWrapper = styled(Container)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  maxWidth: '700px !important',
  background: theme.palette.mode === 'dark' ? 'rgba(26, 31, 58, 0.9)' : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(24px)',
  borderRadius: theme.spacing(3),
  padding: theme.spacing(5),
  border: `1px solid ${
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  }`,
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 12px 40px rgba(0, 0, 0, 0.5)'
      : '0 12px 40px rgba(0, 0, 0, 0.1)',
}));

const DropZone = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isDragActive',
})<{ isDragActive?: boolean }>(({ theme, isDragActive }) => ({
  padding: theme.spacing(6),
  textAlign: 'center',
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  background: isDragActive
    ? theme.palette.mode === 'dark'
      ? 'rgba(31, 90, 246, 0.1)'
      : 'rgba(31, 90, 246, 0.05)'
    : 'transparent',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    background:
      theme.palette.mode === 'dark' ? 'rgba(31, 90, 246, 0.08)' : 'rgba(31, 90, 246, 0.03)',
  },
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
    settings?: any;
    checksum: string;
  };
}

const steps = ['Upload Backup', 'Enter Password', 'Restore Accounts'];

export const RestoreFromBackupPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login: _login, getActiveState } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  // State
  const [activeStep, setActiveStep] = useState(0);
  const [_backupFile, setBackupFile] = useState<File | null>(null);
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
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
      console.error('Backup parse error:', err);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const decryptBackup = async (encryptedData: string, password: string): Promise<any> => {
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
          name: 'PBKDF2',
          salt: encoder.encode('dcc-salt'), // Must match Angular
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      );

      // Decrypt data
      const encryptedBuffer = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
      const iv = encryptedBuffer.slice(0, 12);
      const encrypted = encryptedBuffer.slice(12);

      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);

      return JSON.parse(decoder.decode(decrypted));
    } catch (error) {
      throw new Error('Decryption failed. Please check your password.');
    }
  };

  const handleRestore = async () => {
    if (!backupData || !password) return;

    setIsProcessing(true);
    setError('');

    try {
      let accountsData = backupData.data.accounts;

      // If encrypted, decrypt first
      if (backupData.encrypted) {
        const decryptedData = await decryptBackup(JSON.stringify(backupData.data), password);
        accountsData = decryptedData.accounts;
      }

      // Verify checksum
      // In production, verify SHA-256 checksum matches

      // Import accounts to localStorage (matching Angular storage structure)
      const existingAccounts = localStorage.getItem('dcc_users');
      const existingAccountsList = existingAccounts ? JSON.parse(existingAccounts) : [];

      // Merge accounts (avoid duplicates)
      const mergedAccounts = [...existingAccountsList];
      let newAccountCount = 0;

      for (const account of accountsData) {
        const exists = mergedAccounts.find((a) => a.address === account.address);
        if (!exists) {
          mergedAccounts.push(account);
          newAccountCount++;
        }
      }

      // Save to storage
      localStorage.setItem('dcc_users', JSON.stringify(mergedAccounts));

      // Restore settings if present
      if (backupData.data.settings) {
        localStorage.setItem('dcc_settings', JSON.stringify(backupData.data.settings));
      }

      setRestoredAccounts(newAccountCount);
      setActiveStep(2);

      // Auto-redirect after success
      setTimeout(() => {
        const targetRoute = getActiveState('wallet');
        navigate(targetRoute);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore backup';
      setError(errorMessage);
      console.error('Restore error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
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
                    fontSize: 64,
                    color: isDragActive ? 'primary.main' : 'text.secondary',
                    mb: 2,
                  }}
                />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
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
              <code>dcc-wallet-backup-2025-10-17.json</code>. It was created when you exported your
              wallet from Settings.
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
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
                  p: 2.5,
                  mb: 3,
                  background:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.02)',
                  border: `1px solid ${theme.palette.divider}`,
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
                      sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle
              sx={{
                fontSize: 80,
                color: 'success.main',
                mb: 3,
              }}
            />
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              Wallet Restored Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {restoredAccounts} account{restoredAccounts !== 1 ? 's' : ''} restored from backup
            </Typography>

            {backupData && backupData.data.accounts.length > 0 && (
              <Paper
                sx={{
                  p: 2,
                  mb: 3,
                  textAlign: 'left',
                  background:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 1, display: 'block' }}
                >
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
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                  {backupData.data.accounts.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={`... and ${backupData.data.accounts.length - 5} more`}
                        primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
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
        );

      default:
        return null;
    }
  };

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
                  fontWeight: 800,
                  mb: 1,
                  background: 'linear-gradient(135deg, #1f5af6 0%, #5a81ff 100%)',
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
                    sx={{ textTransform: 'none', fontWeight: 600 }}
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
