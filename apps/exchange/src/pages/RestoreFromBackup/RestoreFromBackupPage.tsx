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

/**
 * Inner payload of a v4.0 backup — recovered after AES-GCM decryption with the backup password.
 * Seeds are already encrypted inside multiAccountData (multiAccount vault format).
 */
interface BackupPayload {
  multiAccountData: string;
  multiAccountHash: string;
  /** Raw JSON string of Record<userHash, {name?, lastLogin?, ...}>. */
  multiAccountUsers: string;
  /** SHA-256 hex of JSON.stringify({multiAccountData, multiAccountHash, multiAccountUsers}). */
  checksum: string;
}

/** v4.0 backup file shape as written to disk by BackupSettings. */
interface WalletBackup {
  version: '4.0';
  encrypted: true;
  timestamp: number;
  /** Non-sensitive hint — actual count verified via checksum after decryption. */
  accountCount: number;
  /** Base64-encoded AES-GCM ciphertext (12-byte IV prepended) of BackupPayload as JSON. */
  data: string;
}

const HiddenInput = styled('input')({
  display: 'none',
});

const steps = ['Upload Backup', 'Enter Password', 'Restore Accounts'];

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
  const [restoredUsers, setRestoredUsers] = useState<Record<string, { name?: string }>>({});

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
      const parsed = JSON.parse(content) as {
        version?: string;
        encrypted?: boolean;
        data?: unknown;
        timestamp?: number;
        accountCount?: number;
      };

      if (
        parsed.version !== '4.0' ||
        parsed.encrypted !== true ||
        typeof parsed.data !== 'string'
      ) {
        if (parsed.version && parsed.version !== '4.0') {
          throw new Error(
            `Backup format v${parsed.version} is not supported. Please export a new backup from Settings → Backup.`,
          );
        }
        throw new Error(
          'Invalid backup file. This does not appear to be a valid DCC wallet backup.',
        );
      }

      setBackupFile(file);
      setBackupData(parsed as WalletBackup);
      setActiveStep(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid backup file. Please check the file and try again.',
      );
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
        void handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      void handleFileSelect(files[0]);
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

      // SECURITY NOTE: The static salt and 100 000 iteration count are intentional backward-
      // compatibility constraints imposed by the legacy Angular wallet. Changing either value
      // would silently break decryption of existing backups created by that app. When Angular
      // compatibility is no longer required, migrate to a random per-backup salt (prepended to
      // the ciphertext) and ≥ 600 000 iterations per OWASP 2024 PBKDF2 guidance.
      const key = await crypto.subtle.deriveKey(
        {
          hash: 'SHA-256',
          iterations: 100000,
          name: 'PBKDF2',
          salt: encoder.encode('dcc-salt'), // Fixed: must match Angular backup format
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

  const generateChecksum = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleRestore = async () => {
    if (!backupData || !password) return;

    setIsProcessing(true);
    setError('');

    try {
      // Decrypt the outer backup envelope with the user-supplied backup password
      const payload = (await decryptBackup(backupData.data, password)) as BackupPayload;

      // Verify checksum — detect file corruption or tampering before writing anything
      const { checksum, ...fields } = payload;
      const computed = await generateChecksum(JSON.stringify(fields));
      if (computed !== checksum) {
        throw new Error(
          'Backup file is corrupted or has been tampered with. Checksum does not match.',
        );
      }

      // Atomically restore the three multiAccount storage keys
      localStorage.setItem('multiAccountData', payload.multiAccountData);
      localStorage.setItem('multiAccountHash', payload.multiAccountHash);
      localStorage.setItem('multiAccountUsers', payload.multiAccountUsers);

      // Invalidate any stale in-memory session (vault content has changed)
      sessionStorage.removeItem('activeSession');

      const userMeta = JSON.parse(payload.multiAccountUsers) as Record<string, { name?: string }>;
      const count = Object.keys(userMeta).length;
      setRestoredAccounts(count);
      setRestoredUsers(userMeta);
      setActiveStep(2);
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

          <HiddenInput
            type="file"
            accept=".json"
            onChange={handleFileInputChange}
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
            Enter the password you used when creating this backup
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
                <strong>Accounts:</strong> {backupData.accountCount}
              </Typography>
              <Typography variant="body2">
                <strong>Encrypted:</strong> Yes
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {new Date(backupData.timestamp).toLocaleString()}
              </Typography>
            </Paper>
          )}

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
                void handleRestore();
              }
            }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="secondary" onClick={() => setActiveStep(0)} fullWidth>
              Back
            </Button>
            <Button variant="primary" onClick={handleRestore} disabled={!password} fullWidth>
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

          {restoredAccounts > 0 && (
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
                {Object.entries(restoredUsers)
                  .slice(0, 5)
                  .map(([hash, meta]) => (
                    <ListItem key={hash} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <AccountCircle fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={meta.name ?? 'Unnamed Account'}
                        primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                {restoredAccounts > 5 && (
                  <ListItem>
                    <ListItemText
                      primary={`... and ${restoredAccounts - 5} more`}
                      primaryTypographyProps={{ color: 'text.secondary', variant: 'caption' }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in with your wallet password to access your accounts.
          </Typography>

          <Button
            variant="primary"
            onClick={() => {
              const targetRoute = getActiveState('wallet');
              void navigate(targetRoute);
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
