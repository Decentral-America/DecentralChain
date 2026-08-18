/**
 * Step 4 — the password that encrypts the wallet on this device.
 *
 * The strength meter reflects the rules the hook enforces, so a user is never
 * shown a full bar for a password that will then be rejected.
 */
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { palette } from '@/styles/tokens';
import { onCanvas } from '@/theme/landingTheme';

/** Count how many of the wallet's password rules a candidate satisfies (0-5). */
export function passwordStrength(password: string): number {
  if (!password) return 0;
  return [
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

const FIELD_SX = {
  '& .MuiInputBase-input': { color: onCanvas.primary },
  '& .MuiInputLabel-root': { color: onCanvas.secondary },
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.32)' },
  },
} as const;

export function SecureStep({
  error,
  isSubmitting,
  onSubmit,
}: {
  error: string;
  isSubmitting: boolean;
  onSubmit: (password: string, confirm: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const strength = passwordStrength(password);

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(password, confirm);
      }}
    >
      <Typography variant="h5" sx={{ color: onCanvas.primary, fontWeight: 700, mb: 0.5 }}>
        Secure your wallet
      </Typography>
      <Typography variant="body2" sx={{ color: onCanvas.secondary, mb: 3 }}>
        This password encrypts your wallet on this device. It cannot be reset.
      </Typography>

      <Stack spacing={2}>
        <TextField
          autoComplete="new-password"
          fullWidth
          label="Password"
          onChange={(e) => setPassword(e.target.value)}
          sx={FIELD_SX}
          type="password"
          value={password}
        />

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Box
              key={i}
              sx={{
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                bgcolor: i < strength ? palette.indigoHover : 'rgba(255,255,255,0.12)',
                borderRadius: 999,
                flex: 1,
                height: 3,
                transition: 'background-color 220ms ease',
              }}
            />
          ))}
        </Box>

        <TextField
          autoComplete="new-password"
          fullWidth
          label="Confirm password"
          onChange={(e) => setConfirm(e.target.value)}
          sx={FIELD_SX}
          type="password"
          value={confirm}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          disabled={isSubmitting}
          fullWidth
          sx={{ bgcolor: palette.indigoHover, py: 1.25 }}
          type="submit"
          variant="contained"
        >
          {isSubmitting ? 'Creating wallet…' : 'Create wallet'}
        </Button>
      </Stack>
    </Box>
  );
}
