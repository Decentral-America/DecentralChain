/**
 * Three-step wallet creation.
 *
 * Replaces a single card that stacked a phrase, two password fields, a warning
 * and a checkbox past the bottom of the viewport. Each step fits a 600px
 * viewport; the container owns only which step is showing.
 *
 * Presentational: every piece of durable state — the seed, the step index, the
 * password fields — is owned by `useCreateWallet` and handed in. SignUp renders
 * this component from two branches rooted at different component types, so
 * crossing the `md` breakpoint remounts it; state held here would be destroyed
 * by a device rotation mid-flow, handing the user a phrase for a wallet that
 * never gets created.
 *
 * Step transitions are a hand-rolled CSS keyframe rather than MUI's
 * `<Slide>`/`<Fade>`. Those components apply `opacity`/`transform`/
 * `transition` as inline styles, a channel a class-based
 * `@media (prefers-reduced-motion: reduce)` rule cannot reach — they only
 * self-disable via `theme.motion.reducedMotion`, which `landingTheme.ts`
 * never sets. A plain `sx` animation is reachable by that same media query,
 * matching the pattern already used by `RecoveryPhraseStep` and `IntroStep`.
 */
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button } from '@mui/material';
import { type TouchEvent, useRef } from 'react';
import { useNavigate } from 'react-router';
import { GlassCard } from '@/components/auth/GlassCard';
import { StepRail } from '@/components/auth/StepRail';
import { onCanvas } from '@/theme/landingTheme';
import { IntroStep } from './steps/IntroStep';
import { RecoveryPhraseStep } from './steps/RecoveryPhraseStep';
import { SecureStep } from './steps/SecureStep';
import { type CreateWalletApi, STEP } from './useCreateWallet';

const STEP_LABELS = ['Start', 'Phrase', 'Secure'];

/** Horizontal swipe distance, in px, that counts as an intentional back gesture. */
const SWIPE_THRESHOLD = 64;

export function CreateWalletWizard({ wallet }: { wallet: CreateWalletApi }) {
  const navigate = useNavigate();
  const { canGoBack, goBack, goTo, step } = wallet;

  // Swipe right to go back, on touch only. Mirrors the button rather than
  // replacing it, so the affordance stays visible either way.
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start !== null && end !== undefined && end - start > SWIPE_THRESHOLD) goBack();
  };

  const renderStep = () => {
    if (step === STEP.INTRO) {
      return (
        <IntroStep
          onContinue={() => goTo(STEP.PHRASE)}
          onLedger={() => void navigate('/import/ledger')}
          showLedger={wallet.isLedgerAvailable}
        />
      );
    }
    if (step === STEP.PHRASE) {
      return (
        <RecoveryPhraseStep
          isCopied={wallet.isCopied}
          isRevealed={wallet.isRevealed}
          // Refused by `goTo` until the phrase has been revealed; the step's own
          // Continue is disabled until then too.
          onContinue={() => goTo(STEP.SECURE)}
          onCopy={() => void wallet.copyPhrase()}
          onReveal={wallet.reveal}
          onRetry={wallet.regenerateSeed}
          seedError={wallet.seedError}
          words={wallet.words}
        />
      );
    }
    return (
      <SecureStep
        confirm={wallet.confirm}
        error={wallet.error}
        isSubmitting={wallet.isSubmitting}
        onConfirmChange={wallet.setConfirm}
        onPasswordChange={wallet.setPassword}
        onSubmit={() => void wallet.submit()}
        password={wallet.password}
      />
    );
  };

  return (
    <GlassCard>
      <StepRail current={step} steps={STEP_LABELS} />

      {canGoBack && (
        <Button
          // Leaving the password step while create() is in flight would unmount
          // the only component that renders `error`, so a later rejection would
          // fail silently.
          disabled={wallet.isSubmitting}
          onClick={goBack}
          size="small"
          startIcon={<ArrowBackIcon />}
          sx={{ color: onCanvas.secondary, mb: 1, minHeight: 44, textTransform: 'none' }}
        >
          Back
        </Button>
      )}

      <Box
        data-testid="wizard-step-area"
        onTouchEnd={onTouchEnd}
        onTouchStart={onTouchStart}
        sx={{ minHeight: 320, overflow: 'hidden', position: 'relative' }}
      >
        <Box
          key={step}
          sx={{
            '@keyframes create-wallet-step-in-back': {
              from: { opacity: 0, transform: 'translateX(-16px)' },
              to: { opacity: 1, transform: 'none' },
            },
            '@keyframes create-wallet-step-in-forward': {
              from: { opacity: 0, transform: 'translateX(16px)' },
              to: { opacity: 1, transform: 'none' },
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            animation: `${
              wallet.isGoingBack ? 'create-wallet-step-in-back' : 'create-wallet-step-in-forward'
            } 220ms ease both`,
          }}
        >
          {renderStep()}
        </Box>
      </Box>
    </GlassCard>
  );
}
