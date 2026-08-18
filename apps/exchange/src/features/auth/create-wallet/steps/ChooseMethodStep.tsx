/**
 * Step 1 — how the user wants to hold their keys.
 *
 * Two equal tiles rather than a banner plus an "OR CONTINUE WITH" divider,
 * which framed Ledger as an interruption to the seed flow rather than a
 * choice between two.
 */
import KeyIcon from '@mui/icons-material/Key';
import UsbIcon from '@mui/icons-material/Usb';
import { Box, Stack, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { palette } from '@/styles/tokens';
import { onCanvas } from '@/theme/landingTheme';

function MethodTile({
  description,
  disabled,
  icon,
  onClick,
  title,
}: {
  description: string;
  disabled?: boolean;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
      sx={{
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        '&:hover:not(:disabled)': {
          bgcolor: 'rgba(255,255,255,0.06)',
          borderColor: palette.indigoHover,
          transform: 'translateY(-2px)',
        },
        bgcolor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        p: 2.5,
        textAlign: 'left',
        transition: 'border-color 180ms ease, transform 180ms ease, background-color 180ms ease',
        width: '100%',
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ color: palette.indigoHover, lineHeight: 0, mt: '2px' }}>{icon}</Box>
        <Box>
          <Typography sx={{ color: onCanvas.primary, fontWeight: 600 }}>{title}</Typography>
          <Typography variant="body2" sx={{ color: onCanvas.secondary }}>
            {description}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function ChooseMethodStep({
  isLedgerSupported,
  onLedger,
  onSeed,
}: {
  isLedgerSupported: boolean;
  onLedger: () => void;
  onSeed: () => void;
}) {
  return (
    <Box>
      <Typography variant="h5" sx={{ color: onCanvas.primary, fontWeight: 700, mb: 0.5 }}>
        How do you want to hold your keys?
      </Typography>
      <Typography variant="body2" sx={{ color: onCanvas.secondary, mb: 3 }}>
        Either way, your keys never leave your control.
      </Typography>

      <Stack spacing={2}>
        <MethodTile
          icon={<KeyIcon />}
          onClick={onSeed}
          title="Recovery phrase"
          description="Fifteen words you write down and store safely. Works on any device."
        />
        <MethodTile
          disabled={!isLedgerSupported}
          icon={<UsbIcon />}
          onClick={onLedger}
          title={isLedgerSupported ? 'Ledger hardware wallet' : 'Ledger — needs Chrome or Edge'}
          description="Your private keys stay on the device and never touch this browser."
        />
      </Stack>
    </Box>
  );
}
