/**
 * Backup Settings Component
 * Export wallet as encrypted backup file
 * Matches Angular backup export functionality
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Paper,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { Download, CheckCircle, AccountCircle } from '@mui/icons-material';
import { Button } from '@/components/atoms/Button';
import { useAuth } from '@/contexts/AuthContext';

interface WalletBackup {
  version: string;
  encrypted: boolean;
  timestamp: number;
  data: {
    accounts: any[];
    settings?: any;
    checksum: string;
  };
}

export const BackupSettings: React.FC = () => {
  const { user: _user } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const encryptBackup = async (data: any, password: string): Promise<string> => {
    try {
      // Match Angular's encryption exactly: PBKDF2 + AES-GCM
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);

      // Derive key using PBKDF2
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
        ['encrypt']
      );

      // Encrypt data with AES-GCM
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(JSON.stringify(data))
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt backup');
    }
  };

  const generateChecksum = async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleExport = async () => {
    setError('');
    setSuccess(false);

    // Validate passwords
    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsExporting(true);

    try {
      // Get all accounts from localStorage
      const accountsData = localStorage.getItem('dcc_users');
      const settingsData = localStorage.getItem('dcc_settings');

      const accounts = accountsData ? JSON.parse(accountsData) : [];
      const settings = settingsData ? JSON.parse(settingsData) : null;

      if (accounts.length === 0) {
        throw new Error('No accounts to backup');
      }

      // Prepare backup data
      const dataToBackup = {
        accounts,
        settings,
      };

      // Generate checksum
      const checksum = await generateChecksum(JSON.stringify(dataToBackup));

      const backupData: WalletBackup = {
        version: '3.0',
        encrypted: true,
        timestamp: Date.now(),
        data: {
          accounts,
          settings,
          checksum,
        },
      };

      // Encrypt if password provided
      const encryptedData = await encryptBackup(backupData.data, password);

      const finalBackup = {
        ...backupData,
        data: encryptedData,
      };

      // Create download
      const blob = new Blob([JSON.stringify(finalBackup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `dcc-wallet-backup-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create backup';
      setError(errorMessage);
      console.error('Backup export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Get account info for preview
  const accountsData = localStorage.getItem('dcc_users');
  const accounts = accountsData ? JSON.parse(accountsData) : [];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
        Export Wallet Backup
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Download an encrypted backup of your wallet accounts and settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
          <AlertTitle>Backup Created Successfully</AlertTitle>
          Your wallet backup has been downloaded. Store it in a secure location.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Alert severity="warning" sx={{ mb: 3 }}>
        <AlertTitle>Security Warning</AlertTitle>
        Your backup file contains sensitive encrypted data. Store it securely and never share the
        backup password. Anyone with both the backup file and password can access your funds.
      </Alert>

      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          background: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
          Accounts to be backed up:
        </Typography>
        {accounts.length > 0 ? (
          <List dense>
            {accounts.map((account: any) => (
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
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No accounts found
          </Typography>
        )}
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
          Backup Password *
        </Typography>
        <TextField
          fullWidth
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter a strong password"
          helperText="Minimum 8 characters. This password encrypts your backup file."
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
          Confirm Password *
        </Typography>
        <TextField
          fullWidth
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          error={confirmPassword !== '' && password !== confirmPassword}
          helperText={
            confirmPassword !== '' && password !== confirmPassword
              ? 'Passwords do not match'
              : 'Confirm your backup password'
          }
        />
      </Box>

      <Alert severity="info" icon={<CheckCircle />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Backup includes:</strong>
        </Typography>
        <Typography variant="body2" component="div">
          • All account addresses and encrypted seeds
          <br />
          • Wallet settings and preferences
          <br />
          • Account names and metadata
          <br />• AES-256 encryption with your password
        </Typography>
      </Alert>

      <Button
        variant="primary"
        fullWidth
        size="large"
        onClick={handleExport}
        disabled={
          !password ||
          !confirmPassword ||
          password !== confirmPassword ||
          isExporting ||
          accounts.length === 0
        }
        startIcon={<Download />}
        sx={{ mb: 2 }}
      >
        {isExporting ? 'Creating Backup...' : 'Download Encrypted Backup'}
      </Button>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', textAlign: 'center' }}
      >
        File will be saved as: dcc-wallet-backup-{new Date().toISOString().split('T')[0]}.json
      </Typography>
    </Box>
  );
};
