/**
 * Step 2 — the recovery phrase.
 *
 * The real words never enter the DOM until the user asks for them: each slot
 * renders a placeholder (plus the blurred grid, belt and braces) until
 * revealed, so a screen reader, view-source, DevTools, or Ctrl+F cannot pick
 * the phrase up early. Revealing is one-way: once shown it stays shown,
 * because re-hiding would only obstruct someone mid-transcription. Copy is
 * available before the reveal, so a password-manager user can capture the
 * phrase in one action — but it is not a way around the reveal: "I've saved
 * it" stays disabled until the phrase has been shown, so every user sees the
 * words at least once.
 *
 * Fully controlled: `isRevealed` and `onReveal` are required and there is no
 * local mirror of them. Revealing has to outlive this component — the wizard
 * remounts it on every navigation away and back — and an optional prop would
 * let a caller render the step unwired and silently lose that guarantee.
 */
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
import ShieldIcon from '@mui/icons-material/Shield';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { palette } from '@/styles/tokens';
import { onCanvas } from '@/theme/landingTheme';

export function RecoveryPhraseStep({
  isCopied,
  isRevealed,
  onContinue,
  onCopy,
  onReveal,
  onRetry,
  seedError,
  words,
}: {
  isCopied: boolean;
  /**
   * Whether the phrase has been revealed. Owned by the caller, because the
   * wizard remounts this step every time the user navigates away and back
   * (e.g. Back to reconsider Ledger, then forward again) and revealing is
   * one-way — re-hiding would only obstruct someone mid-transcription — so
   * that fact has to survive a remount this component cannot.
   */
  isRevealed: boolean;
  onContinue: () => void;
  onCopy: () => void;
  /** Fired when the user asks to see the phrase; the caller flips `isRevealed`. */
  onReveal: () => void;
  onRetry: () => void;
  seedError: string;
  words: string[];
}) {
  const revealed = isRevealed;

  // Generation failed: there is no phrase to show, so offer a retry rather
  // than an empty grid the user cannot act on.
  if (seedError) {
    return (
      <Box>
        <Typography variant="h5" sx={{ color: onCanvas.primary, fontWeight: 700, mb: 1 }}>
          Your recovery phrase
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {seedError}
        </Alert>
        <Button
          fullWidth
          onClick={onRetry}
          sx={{ bgcolor: palette.indigoHover }}
          variant="contained"
        >
          Try again
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ color: onCanvas.primary, fontWeight: 700, mb: 0.5 }}>
        Your recovery phrase
      </Typography>
      <Typography variant="body2" sx={{ color: onCanvas.secondary, mb: 2 }}>
        Write these {words.length} words down in order and store them offline.
      </Typography>

      {/* Replaces the orange warning banner: same weight of message, in the
          brand's own palette rather than a colour used nowhere else. */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'flex-start',
          bgcolor: 'rgba(124, 92, 255, 0.08)',
          border: '1px solid rgba(124, 92, 255, 0.35)',
          borderRadius: '12px',
          mb: 2.5,
          p: 1.75,
        }}
      >
        <ShieldIcon sx={{ color: palette.indigoHover, fontSize: 20, mt: '1px' }} />
        <Typography variant="body2" sx={{ color: onCanvas.primary }}>
          Anyone with these words controls your funds. Never type them into a website and never
          store them on this device.
        </Typography>
      </Stack>

      <Box sx={{ position: 'relative' }}>
        <Box
          data-testid="seed-grid"
          data-revealed={revealed ? 'true' : 'false'}
          sx={{
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            display: 'grid',
            filter: revealed ? 'none' : 'blur(7px)',
            gap: 1,
            gridTemplateColumns: {
              md: 'repeat(5, 1fr)',
              sm: 'repeat(3, 1fr)',
              xs: 'repeat(2, 1fr)',
            },
            transition: 'filter 320ms ease',
            userSelect: revealed ? 'auto' : 'none',
          }}
        >
          {words.map((word, index) => (
            <Stack
              // biome-ignore lint/suspicious/noArrayIndexKey: seed phrase position is semantically significant; words can repeat
              key={`${index}-${word}`}
              data-testid="seed-word"
              direction="row"
              spacing={0.75}
              sx={{
                '@keyframes seed-word-in': {
                  from: { opacity: 0, transform: 'translateY(6px)' },
                  to: { opacity: 1, transform: 'none' },
                },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                alignItems: 'baseline',
                animation: revealed ? 'seed-word-in 260ms ease both' : 'none',
                animationDelay: revealed ? `${index * 25}ms` : '0ms',
                bgcolor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                px: 1.25,
                py: 0.75,
              }}
            >
              <Typography variant="caption" sx={{ color: onCanvas.secondary, minWidth: 16 }}>
                {index + 1}
              </Typography>
              <Typography sx={{ color: onCanvas.primary, fontFamily: 'monospace', fontSize: 14 }}>
                {/* The real word is kept out of the DOM entirely until revealed — the blur
                    above is only a visual belt-and-braces, not the guarantee. */}
                {revealed ? word : '••••••'}
              </Typography>
            </Stack>
          ))}
        </Box>

        {!revealed && (
          <Button
            onClick={onReveal}
            startIcon={<VisibilityIcon />}
            sx={{
              color: onCanvas.primary,
              inset: 0,
              position: 'absolute',
              textTransform: 'none',
              width: '100%',
            }}
          >
            Tap to reveal
          </Button>
        )}
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
        <Button
          onClick={onCopy}
          startIcon={isCopied ? <DoneIcon /> : <ContentCopyIcon />}
          sx={{ borderColor: 'rgba(255,255,255,0.25)', color: onCanvas.primary }}
          variant="outlined"
        >
          {isCopied ? 'Copied' : 'Copy'}
        </Button>
        <Button
          disabled={!revealed}
          fullWidth
          onClick={onContinue}
          sx={{ bgcolor: palette.indigoHover }}
          variant="contained"
        >
          I've saved it
        </Button>
      </Stack>
    </Box>
  );
}
