/**
 * Backup Settings Component
 * Export wallet as encrypted backup file
 * Matches Angular backup export functionality
 */

import { AccountCircle, CheckCircle, Download } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

/** User metadata entry as stored under multiAccountUsers in localStorage. */
interface StoredUserMeta {
  name?: string;
  lastLogin?: number;
  [key: string]: unknown;
}

/**
 * Inner payload of a v4.0 backup, encrypted with the user-supplied backup password.
 * Seeds are already encrypted inside multiAccountData (multiAccount vault format);
 * this adds a second AES-GCM envelope so a stolen backup file alone exposes nothing.
 */
interface BackupPayload {
  /** Encrypted vault blob (@decentralchain/ts-lib-crypto encryptSeed format). */
  multiAccountData: string;
  /** Blake2b hash for vault integrity verification at login time. */
  multiAccountHash: string;
  /** Raw JSON string of Record<userHash, StoredUserMeta> — names, settings, lastLogin. */
  multiAccountUsers: string;
  /** SHA-256 hex of JSON.stringify({multiAccountData, multiAccountHash, multiAccountUsers}). */
  checksum: string;
}

/** v4.0 backup file produced by this application. */
interface WalletBackup {
  version: '4.0';
  encrypted: true;
  timestamp: number;
  /** Non-sensitive hint — actual count verified via checksum after decryption. */
  accountCount: number;
  /** Base64-encoded AES-GCM ciphertext (12-byte IV prepended) of BackupPayload as JSON. */
  data: string;
}

export const BackupSettings: React.FC = () => {
  useAuth(); // ensure auth context is available
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const encryptBackup = async (data: BackupPayload, password: string): Promise<string> => {
    try {
      // Match Angular's encryption exactly: PBKDF2 + AES-GCM
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);

      // Derive key using PBKDF2
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
        ['encrypt'],
      );

      // Encrypt data with AES-GCM
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { iv, name: 'AES-GCM' },
        key,
        encoder.encode(JSON.stringify(data)),
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.error('Encryption error:', error);
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

    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsExporting(true);

    try {
      // Read from the multiAccount storage keys — the single source of truth for all account data
      const multiAccountData = localStorage.getItem('multiAccountData');
      const multiAccountHash = localStorage.getItem('multiAccountHash');
      const multiAccountUsers = localStorage.getItem('multiAccountUsers') ?? '{}';

      if (!multiAccountData || !multiAccountHash) {
        throw new Error('No wallet found. Please create an account before exporting a backup.');
      }

      const userMeta = JSON.parse(multiAccountUsers) as Record<string, StoredUserMeta>;
      const accountCount = Object.keys(userMeta).length;
      if (accountCount === 0) {
        throw new Error('No accounts to backup.');
      }

      // Build the inner payload — seeds are already encrypted inside multiAccountData;
      // the backup password adds a second AES-GCM envelope so a stolen file alone exposes nothing.
      const payloadFields = { multiAccountData, multiAccountHash, multiAccountUsers };
      const checksum = await generateChecksum(JSON.stringify(payloadFields));
      const payload: BackupPayload = { ...payloadFields, checksum };
      const encryptedPayload = await encryptBackup(payload, password);

      const backup: WalletBackup = {
        accountCount,
        data: encryptedPayload,
        encrypted: true,
        timestamp: Date.now(),
        version: '4.0',
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `dcc-exchange-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create backup';
      setError(errorMessage);
      logger.error('Backup export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Preview — read from multiAccountUsers metadata (seeds stay encrypted, no addresses needed here)
  const multiAccountUsersRaw = localStorage.getItem('multiAccountUsers') ?? '{}';
  const accountMeta = JSON.parse(multiAccountUsersRaw) as Record<string, StoredUserMeta>;
  const accounts = Object.entries(accountMeta).map(([hash, meta]) => ({
    hash,
    name: meta.name ?? 'Unnamed Account',
  }));

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
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
          background: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          mb: 3,
          p: 2.5,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Accounts to be backed up:
        </Typography>
        {accounts.length > 0 ? (
          <List dense>
            {accounts.map((account) => (
              <ListItem key={account.hash} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <AccountCircle fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={account.name}
                  primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
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
          helperText="Minimum 12 characters. This password encrypts your backup file."
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
          • Encrypted vault — all seeds protected by your wallet password
          <br />• Account names and metadata
          <br />• Wallet settings and preferences
          <br />• Double-layered AES-256 encryption with your backup password
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
          // biome-ignore lint/nursery/useNullishCoalescing: boolean OR chain — ?? would short-circuit when isExporting===false, skipping accounts check
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
        File will be saved as: dcc-exchange-backup-{new Date().toISOString().split('T')[0]}.json
      </Typography>
    </Box>
  );
};
