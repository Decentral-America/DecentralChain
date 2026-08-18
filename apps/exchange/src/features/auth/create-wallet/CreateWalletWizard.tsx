/**
 * Four-step wallet creation.
 *
 * Replaces a single card that stacked a phrase, two password fields, a warning
 * and a checkbox past the bottom of the viewport. Each step fits a 600px
 * viewport; the container owns only which step is showing.
 *
 * Step transitions are a hand-rolled CSS keyframe rather than MUI's
 * `<Slide>`/`<Fade>`. Those components apply `opacity`/`transform`/
 * `transition` as inline styles, a channel a class-based
 * `@media (prefers-reduced-motion: reduce)` rule cannot reach — they only
 * self-disable via `theme.motion.reducedMotion`, which `landingTheme.ts`
 * never sets. A plain `sx` animation is reachable by that same media query,
 * matching the pattern already used by `RecoveryPhraseStep` and `VerifyStep`.
 */
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button } from '@mui/material';
import { type TouchEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { GlassCard } from '@/components/auth/GlassCard';
import { StepRail } from '@/components/auth/StepRail';
import { onCanvas } from '@/theme/landingTheme';
import { ChooseMethodStep } from './steps/ChooseMethodStep';
import { RecoveryPhraseStep } from './steps/RecoveryPhraseStep';
import { SecureStep } from './steps/SecureStep';
import { VerifyStep } from './steps/VerifyStep';
import { useCreateWallet } from './useCreateWallet';

const STEP_LABELS = ['Method', 'Phrase', 'Verify', 'Secure'];

/** Horizontal swipe distance, in px, that counts as an intentional back gesture. */
const SWIPE_THRESHOLD = 64;

export function CreateWalletWizard() {
  const wallet = useCreateWallet();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  // Direction only affects which way the next transition slides in from, so a
  // ref avoids a render purely to record it.
  const goingBack = useRef(false);

  const goTo = (next: number) => {
    goingBack.current = next < step;
    setStep(next);
  };

  // Back is available from every step after the first. Without it a user on
  // the verify step who needs to re-read their phrase would be stuck.
  const canGoBack = step > 0;
  const goBack = () => {
    if (canGoBack) goTo(step - 1);
  };

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
    if (step === 0) {
      return (
        <ChooseMethodStep
          isLedgerSupported={wallet.isLedgerSupported}
          onLedger={() => void navigate('/import/ledger')}
          onSeed={() => goTo(1)}
        />
      );
    }
    if (step === 1) {
      return (
        <RecoveryPhraseStep
          isCopied={wallet.isCopied}
          isRevealed={wallet.isRevealed}
          onContinue={() => goTo(2)}
          onCopy={() => void wallet.copyPhrase()}
          onReveal={wallet.reveal}
          onRetry={wallet.regenerateSeed}
          seedError={wallet.seedError}
          words={wallet.words}
        />
      );
    }
    if (step === 2) {
      return <VerifyStep challenges={wallet.challenges} onComplete={() => goTo(3)} />;
    }
    return (
      <SecureStep
        error={wallet.error}
        isSubmitting={wallet.isSubmitting}
        onSubmit={(password, confirm) => void wallet.submit(password, confirm)}
      />
    );
  };

  return (
    <GlassCard>
      <StepRail current={step} steps={STEP_LABELS} />

      {canGoBack && (
        <Button
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
              goingBack.current ? 'create-wallet-step-in-back' : 'create-wallet-step-in-forward'
            } 220ms ease both`,
          }}
        >
          {renderStep()}
        </Box>
      </Box>
    </GlassCard>
  );
}
