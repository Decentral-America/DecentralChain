/**
 * Step 1 — what the user is about to be handed.
 *
 * This was a two-tile method chooser. Ledger is not supported yet and is now
 * behind `config.ledgerEnabled`, and a chooser with a single option reads as a
 * dead end, so with the flag off the step is a short intro instead: the three
 * facts that make the next screen matter, then Continue.
 *
 * With the flag on the Ledger tile reappears here as a real second choice. Both
 * modes are one component because the copy above the buttons is true either
 * way — Ledger changes where the keys live, not that they are the user's
 * problem to keep.
 *
 * The entrance stagger is hand-rolled keyframes in `sx` rather than MUI's
 * `<Fade>`/`<Grow>`: those apply opacity and transform as inline styles, which
 * a class-based `@media (prefers-reduced-motion: reduce)` rule cannot reach.
 */
import KeyIcon from '@mui/icons-material/Key';
import LockResetIcon from '@mui/icons-material/LockReset';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import UsbIcon from '@mui/icons-material/Usb';
import { Box, Button, Divider, Stack, Typography, useTheme } from '@mui/material';
import { type ReactNode } from 'react';
import { tokens } from '@/theme/tokens/semantic';

const POINTS: { icon: ReactNode; text: string; title: string }[] = [
  {
    icon: <PhoneIphoneIcon fontSize="small" />,
    text: 'Nothing is uploaded and no account is created on a server.',
    title: 'Your keys stay on this device',
  },
  {
    icon: <KeyIcon fontSize="small" />,
    text: 'Write them down on the next screen — they restore your wallet anywhere.',
    title: 'Fifteen words are the only backup',
  },
  {
    icon: <LockResetIcon fontSize="small" />,
    text: 'Not us, not support. Lose the words and the funds are gone with them.',
    title: 'Nobody can reset them for you',
  },
];

export function IntroStep({
  onContinue,
  onLedger,
  showLedger,
}: {
  onContinue: () => void;
  onLedger: () => void;
  /**
   * Whether to offer the Ledger tile. True only when the feature flag is on
   * *and* the browser can talk to the device (WebHID) — the caller ANDs both,
   * so this step never advertises a path that would dead-end on click.
   */
  showLedger: boolean;
}) {
  const mode = useTheme().palette.mode;
  const t = tokens(mode);

  return (
    <Box>
      <Typography variant="h5" sx={{ color: t.text.primary, fontWeight: 700, mb: 0.5 }}>
        Before you start
      </Typography>
      <Typography variant="body2" sx={{ color: t.text.secondary, mb: 2.5 }}>
        Three things to know about a wallet only you can open.
      </Typography>

      <Stack spacing={1.75} sx={{ mb: 3 }}>
        {POINTS.map((point, index) => (
          <Stack
            key={point.title}
            direction="row"
            spacing={1.75}
            sx={{
              '@keyframes intro-point-in': {
                from: { opacity: 0, transform: 'translateY(6px)' },
                to: { opacity: 1, transform: 'none' },
              },
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              alignItems: 'flex-start',
              animation: 'intro-point-in 260ms ease both',
              animationDelay: `${index * 60}ms`,
            }}
          >
            <Box sx={{ color: t.accent.primary, flexShrink: 0, lineHeight: 0, mt: '3px' }}>
              {point.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: t.text.primary, fontSize: 15, fontWeight: 600 }}>
                {point.title}
              </Typography>
              <Typography variant="body2" sx={{ color: t.text.secondary }}>
                {point.text}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>

      <Button
        fullWidth
        onClick={onContinue}
        sx={{ bgcolor: t.accent.primary, py: 1.25 }}
        variant="contained"
      >
        Continue
      </Button>

      {showLedger && (
        <>
          <Divider
            sx={{
              '&::before, &::after': { borderColor: t.border.subtle },
              color: t.text.secondary,
              fontSize: 12,
              my: 2,
            }}
          >
            or
          </Divider>

          <Box
            component="button"
            onClick={onLedger}
            type="button"
            sx={{
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
              '&:hover': {
                bgcolor: t.surface.hover,
                borderColor: t.accent.primary,
              },
              bgcolor: t.surface.sunken,
              border: `1px solid ${t.border.subtle}`,
              borderRadius: '14px',
              cursor: 'pointer',
              p: 2,
              textAlign: 'left',
              transition: 'border-color 180ms ease, background-color 180ms ease',
              width: '100%',
            }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{ color: t.accent.primary, lineHeight: 0, mt: '2px' }}>
                <UsbIcon fontSize="small" />
              </Box>
              <Box>
                <Typography sx={{ color: t.text.primary, fontWeight: 600 }}>
                  Ledger hardware wallet
                </Typography>
                <Typography variant="body2" sx={{ color: t.text.secondary }}>
                  Your private keys stay on the device and never touch this browser.
                </Typography>
              </Box>
            </Stack>
          </Box>
        </>
      )}
    </Box>
  );
}
