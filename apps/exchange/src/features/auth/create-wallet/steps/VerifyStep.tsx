/**
 * Step 3 — prove the phrase was actually written down.
 *
 * A wrong answer costs nothing but a shake: the goal is to make sure the user
 * has the phrase, not to punish a misremembered position. There is no attempt
 * counter and no lockout, because locking someone out of a wallet they have
 * already generated helps nobody.
 */
import { Box, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { palette } from '@/styles/tokens';
import { onCanvas } from '@/theme/landingTheme';
import { type VerifyChallenge } from '../verification';

export function VerifyStep({
  challenges,
  onComplete,
}: {
  challenges: VerifyChallenge[];
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  // Guards against a second onComplete() call: the final challenge's tiles
  // stay mounted after completion (the parent decides when to move on), so
  // without this a stray click on the same tile would re-evaluate a still-
  // correct answer and fire onComplete again.
  const [completed, setCompleted] = useState(false);

  const challenge = challenges[index];
  if (!challenge) return null;

  const answer = (choice: string) => {
    if (completed) return;
    if (choice !== challenge.answer) {
      setWrong(choice);
      return;
    }
    setWrong(null);
    if (index + 1 >= challenges.length) {
      setCompleted(true);
      onComplete();
      return;
    }
    setIndex(index + 1);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ color: onCanvas.primary, fontWeight: 700, mb: 0.5 }}>
        Confirm your phrase
      </Typography>
      <Typography variant="body2" sx={{ color: onCanvas.secondary, mb: 3 }}>
        Question {index + 1} of {challenges.length}
      </Typography>

      <Typography sx={{ color: onCanvas.primary, mb: 2 }}>
        Which word is <strong>word #{challenge.position}</strong>?
      </Typography>

      <Stack spacing={1.25}>
        {challenge.choices.map((choice, i) => (
          <Box
            component="button"
            key={`${challenge.position}-${choice}`}
            type="button"
            onClick={() => answer(choice)}
            sx={{
              '@keyframes verify-shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(-6px)' },
                '75%': { transform: 'translateX(6px)' },
              },
              '@keyframes verify-tile-in': {
                from: { opacity: 0, transform: 'translateY(8px)' },
                to: { opacity: 1, transform: 'none' },
              },
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
                transition: 'none',
              },
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: palette.indigoHover },
              animation: `verify-tile-in 220ms ease both, ${
                wrong === choice ? 'verify-shake 280ms ease' : 'none'
              }`,
              animationDelay: `${i * 60}ms, 0ms`,
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid',
              borderColor: wrong === choice ? 'error.main' : 'rgba(255,255,255,0.12)',
              borderRadius: '12px',
              color: onCanvas.primary,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 15,
              py: 1.5,
              transition: 'border-color 180ms ease, background-color 180ms ease',
              width: '100%',
            }}
          >
            {choice}
          </Box>
        ))}
      </Stack>

      {wrong && (
        <Typography variant="body2" sx={{ color: 'error.main', mt: 2 }}>
          Not that one — check your written copy and try again.
        </Typography>
      )}
    </Box>
  );
}
