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
  isSubmitting,
  onConfirmChange,
  onPasswordChange,
  onSubmit,
  password,
}: {
  confirm: string;
  error: string;
  isSubmitting: boolean;
  onConfirmChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
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
        Secure your wallet
      </Typography>
      <Typography variant="body2" sx={{ color: t.text.secondary, mb: 3 }}>
        This password encrypts your wallet on this device. It cannot be reset.
      </Typography>

      <Stack spacing={2}>
        <TextField
          autoComplete="new-password"
          fullWidth
          label="Password"
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

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          disabled={isSubmitting}
          fullWidth
          sx={{ bgcolor: t.accent.primary, py: 1.25 }}
          type="submit"
          variant="contained"
        >
          {isSubmitting ? 'Creating wallet…' : 'Create wallet'}
        </Button>
      </Stack>
    </Box>
  );
}
