/**
 * Progress indicator for the create-wallet wizard.
 *
 * Labels carry a `data-state` of complete / current / upcoming so styling and
 * tests read from one source rather than inferring position twice.
 */
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { tokens } from '@/theme/tokens/semantic';

type StepState = 'complete' | 'current' | 'upcoming';

function stateFor(index: number, current: number): StepState {
  if (index < current) return 'complete';
  if (index === current) return 'current';
  return 'upcoming';
}

export function StepRail({ steps, current }: { steps: string[]; current: number }) {
  const mode = useTheme().palette.mode;
  const t = tokens(mode);
  const filled = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100;

  return (
    <Box
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={current + 1}
      aria-label="Wallet setup progress"
      sx={{ mb: 3 }}
    >
      <Box sx={{ bgcolor: t.border.subtle, borderRadius: 999, height: 3, mb: 1.5 }}>
        <Box
          data-testid="step-rail-fill"
          sx={{
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            bgcolor: t.accent.primary,
            borderRadius: 999,
            height: '100%',
            transition: 'width 320ms ease',
            width: `${filled}%`,
          }}
        />
      </Box>

      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        {steps.map((label, index) => {
          const state = stateFor(index, current);
          return (
            <Typography
              key={label}
              data-state={state}
              variant="caption"
              sx={{
                '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                color: state === 'upcoming' ? t.text.secondary : t.text.primary,
                fontWeight: state === 'current' ? 700 : 400,
                opacity: state === 'upcoming' ? 0.6 : 1,
                transition: 'opacity 200ms ease, color 200ms ease',
              }}
            >
              {label}
            </Typography>
          );
        })}
      </Stack>
    </Box>
  );
}
