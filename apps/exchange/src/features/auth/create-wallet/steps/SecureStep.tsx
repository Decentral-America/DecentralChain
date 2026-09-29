/**
 * Step 3 — the password that encrypts the wallet on this device.
 *
 * The strength meter reflects the rules the hook enforces, so a user is never
 * shown a full bar for a password that will then be rejected.
 *
 * The fields are controlled by `useCreateWallet` rather than by local state:
 * the wizard remounts this step on every navigation, so a user who stepped
 * back to re-read their phrase after a failed attempt would otherwise return
 * to two empty boxes.
 */
import { Alert, Box, Button, Stack, TextField, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { type ThemeMode, tokens } from '@/theme/tokens/semantic';

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

function fieldSx(mode: ThemeMode) {
  const t = tokens(mode);
  return {
    '& .MuiInputBase-input': { color: t.text.primary },
    '& .MuiInputLabel-root': { color: t.text.secondary },
    '& .MuiOutlinedInput-root': {
      '& fieldset': { borderColor: t.border.subtle },
      '&:hover fieldset': { borderColor: t.border.strong },
    },
  } as const;
}

export function SecureStep({
  confirm,
  error,
  hasExistingVault,
  isSubmitting,
  needsVaultReset = false,
  onConfirmChange,
  onPasswordChange,
  onResetVault,
  onSubmit,
  password,
}: {
  confirm: string;
  error: string;
  /** A vault already lives on this device; this password has to unlock it, not invent a new one. */
  hasExistingVault: boolean;
  isSubmitting: boolean;
  /** The stored vault cannot be opened by any password; offer the way out. */
  needsVaultReset?: boolean;
  onConfirmChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onResetVault?: () => void;
  onSubmit: () => void;
  password: string;
}) {
  const mode = useTheme().palette.mode;
  const t = tokens(mode);
  const strength = passwordStrength(password);

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Typography variant="h5" sx={{ color: t.text.primary, fontWeight: 700, mb: 0.5 }}>
        {hasExistingVault ? 'Unlock this device' : 'Secure your wallet'}
      </Typography>
      <Typography variant="body2" sx={{ color: t.text.secondary, mb: 3 }}>
        {hasExistingVault
          ? 'This device already holds a wallet, and one password unlocks every account on it. Enter that password to add this one — it is not a new password.'
          : 'This password encrypts your wallet on this device. It cannot be reset.'}
      </Typography>

      <Stack spacing={2}>
        <TextField
          autoComplete="new-password"
          fullWidth
          label={hasExistingVault ? "This device's password" : 'Password'}
          onChange={(e) => onPasswordChange(e.target.value)}
          sx={fieldSx(mode)}
          type="password"
          value={password}
        />

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Box
              key={i}
              sx={{
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                bgcolor: i < strength ? t.accent.primary : t.border.subtle,
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
          onChange={(e) => onConfirmChange(e.target.value)}
          sx={fieldSx(mode)}
          type="password"
          value={confirm}
        />

        {error && (
          <Alert
            /*
              A vault no password can open is not a failed attempt, so it does
              not get the red that says "try again". The only move left is
              destructive, and the button says what it destroys rather than
              leaving the user to discover it.
            */
            action={
              needsVaultReset && onResetVault ? (
                <Button color="inherit" onClick={onResetVault} size="small">
                  Erase and start over
                </Button>
              ) : undefined
            }
            severity={needsVaultReset ? 'warning' : 'error'}
          >
            {error}
            {needsVaultReset && (
              <Typography sx={{ display: 'block', fontSize: 13, mt: 0.5, opacity: 0.9 }}>
                Erasing removes every wallet stored in this browser. Any account whose recovery
                phrase you have not written down is lost for good.
              </Typography>
            )}
          </Alert>
        )}

        <Button
          disabled={isSubmitting}
          fullWidth
          sx={{ bgcolor: t.accent.primary, py: 1.25 }}
          type="submit"
          variant="contained"
        >
          {isSubmitting
            ? 'Creating wallet…'
            : hasExistingVault
              ? 'Unlock and add wallet'
              : 'Create wallet'}
        </Button>

        {/*
          A separate, opt-in escape from the one the failed-password Alert
          above offers automatically. That one only appears for a vault no
          password can open (`needsVaultReset`); a plain wrong guess should
          never be one click from destroying data, so this starts collapsed
          and asks again before it does anything.
        */}
        {hasExistingVault && !needsVaultReset && onResetVault && (
          <ForgottenVaultPassword onReset={onResetVault} t={t} />
        )}
      </Stack>
    </Box>
  );
}

/** "I don't know this device's password" — a second confirmation before erasing it. */
function ForgottenVaultPassword({
  onReset,
  t,
}: {
  onReset: () => void;
  t: ReturnType<typeof tokens>;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        onClick={() => setConfirming(true)}
        size="small"
        sx={{ color: t.text.tertiary, fontWeight: 400, textTransform: 'none' }}
        type="button"
      >
        Don't know this device's password?
      </Button>
    );
  }

  return (
    <Alert
      action={
        <Button color="inherit" onClick={onReset} size="small">
          Erase and start over
        </Button>
      }
      onClose={() => setConfirming(false)}
      severity="warning"
    >
      Erasing removes every wallet stored in this browser. Any account whose recovery phrase you
      have not written down is lost for good.
    </Alert>
  );
}
