/**
 * State and side effects for the create-wallet wizard.
 *
 * Everything that touches Seed, AuthContext or the router lives here so the
 * step components stay presentational and this can be tested without rendering
 * a wizard. Behaviour is carried over from the screen this replaces, with one
 * change: `hasBackup` is claimed by the user pressing "I've saved it" after the
 * phrase has actually been shown to them. That reveal is the only evidence
 * behind the flag, so `goTo` refuses to pass the phrase step without it.
 *
 * This hook owns the *whole* wizard, step index and password fields included,
 * not just the seed. SignUp renders the wizard from two branches rooted at
 * different component types (a mobile shell and a desktop scene), so crossing
 * the `md` breakpoint — a tablet rotation is enough — unmounts one tree and
 * mounts the other. Anything held inside the wizard component would be thrown
 * away by that flip: a user who had written down their phrase would silently
 * be given a different one, and would finish the flow holding a backup for a
 * wallet that was never created. Calling this hook above the branch is what
 * makes the flip survivable.
 */
import { Seed } from 'data-service/classes/Seed';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { config } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { logger } from '@/lib/logger';

/**
 * Zero-based step indices. Exported so the wizard's navigation and this hook's
 * guard read from one list rather than each hard-coding numbers that then drift
 * apart when a step is added or dropped.
 */
export const STEP = { INTRO: 0, PHRASE: 1, SECURE: 2 } as const;

export interface CreateWalletApi {
  words: string[];
  /**
   * Whether to offer the Ledger path: the feature flag *and* WebHID support.
   * Both, because the flag alone would advertise a device this browser cannot
   * talk to, and WebHID alone would ship an unfinished integration.
   */
  isLedgerAvailable: boolean;
  isCopied: boolean;
  isSubmitting: boolean;
  error: string;
  /** Set when Seed.create() threw; the phrase step shows this with a retry. */
  seedError: string;
  /**
   * Whether the phrase has ever been revealed this session. Lives here,
   * rather than as local state on the phrase step, because the wizard
   * remounts that step on every navigation away and back — revealing is
   * one-way, so the fact of having revealed must outlive those remounts.
   */
  isRevealed: boolean;
  /** Zero-based index of the step on screen. */
  step: number;
  /** True when the last navigation went backwards; drives the slide direction. */
  isGoingBack: boolean;
  canGoBack: boolean;
  goTo: (next: number) => void;
  goBack: () => void;
  /**
   * The password fields. Held here rather than on the password step so that
   * stepping back to re-read the phrase after a failed attempt does not empty
   * them — the step component is remounted on every navigation.
   */
  password: string;
  confirm: string;
  setPassword: (value: string) => void;
  setConfirm: (value: string) => void;
  regenerateSeed: () => void;
  /** Marks the phrase as revealed. Idempotent; safe to call more than once. */
  reveal: () => void;
  copyPhrase: () => Promise<void>;
  submit: () => Promise<boolean>;
}

interface SeedState {
  seed: Seed | null;
  seedError: string;
  words: string[];
}

/**
 * Generate a fresh seed phrase.
 *
 * A module-level function (rather than inline in the hook) so the initial
 * generation — via useState's lazy initializer — and an explicit retry via
 * regenerateSeed can share it without a hook dependency ever needing to
 * "reference" a retry counter just to justify re-running it.
 */
function generateSeedState(): SeedState {
  try {
    const seed = Seed.create();
    return { seed, seedError: '', words: seed.phrase.split(' ') };
  } catch (err) {
    logger.error('[CreateWallet] seed generation failed:', err);
    return {
      seed: null,
      seedError: 'Could not generate a recovery phrase. Try again.',
      words: [],
    };
  }
}

/**
 * Validate a password against the wallet's rules.
 *
 * @returns An error message, or null when the password is acceptable.
 */
export function validatePassword(password: string, confirm: string): string | null {
  if (!password) return 'Please enter a password';
  if (password.length < 12) return 'Password must be at least 12 characters';

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
    return 'Password must contain uppercase, lowercase, a digit, and a special character';
  }

  if (password !== confirm) return 'Passwords do not match';
  return null;
}

export function useCreateWallet(): CreateWalletApi {
  // Generated once per mount. A re-generated phrase mid-flow would invalidate
  // whatever the user has already written down, so this only changes when the
  // user explicitly retries after a generation failure, via regenerateSeed.
  const [seedState, setSeedState] = useState<SeedState>(generateSeedState);
  const seed = seedState.seed;
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [step, setStep] = useState(0);
  const [isGoingBack, setIsGoingBack] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const { create, user, isAuthenticated, getActiveState } = useAuth();
  const { isCopied, copyToClipboard } = useClipboard();
  const navigate = useNavigate();

  const regenerateSeed = useCallback(() => {
    setSeedState(generateSeedState());
    // A new phrase has never been seen, whatever was true of the old one.
    setIsRevealed(false);
  }, []);
  const reveal = useCallback(() => setIsRevealed(true), []);

  const goTo = useCallback(
    (next: number) => {
      // The only gate left in the flow. `hasBackup: true` was earned by passing
      // verification; with that step gone it rests entirely on the phrase having
      // been shown, so the password step is unreachable until it has been.
      // RecoveryPhraseStep also disables its own Continue, but this is the
      // guarantee — no caller can navigate around it.
      if (next >= STEP.SECURE && !isRevealed) return;

      setIsGoingBack(next < step);
      setStep(next);
      // The step components are remounted on every navigation, so an error
      // left over from a previous attempt would otherwise reappear next to
      // fields the user has not touched yet.
      setError('');
    },
    [isRevealed, step],
  );

  // Back is available from every step after the first. Without it a user on
  // the password step who needs to re-read their phrase would be stuck.
  const canGoBack = step > 0;
  const goBack = useCallback(() => {
    if (step > 0) goTo(step - 1);
  }, [goTo, step]);

  // The flag gates the unfinished integration; WebHID (Chrome and Edge only)
  // gates the browsers that could not drive the device anyway.
  const isLedgerAvailable =
    config.ledgerEnabled && typeof navigator !== 'undefined' && 'hid' in navigator;

  // Navigation is deferred until creation has settled, so ProtectedRoute sees
  // isAuthenticated before the route changes.
  useEffect(() => {
    if (isAuthenticated && user && !isSubmitting && !isCreating) {
      void navigate(getActiveState('wallet'), { replace: true });
    }
  }, [isAuthenticated, user, isSubmitting, isCreating, navigate, getActiveState]);

  const copyPhrase = useCallback(async () => {
    if (seed) await copyToClipboard(seed.phrase);
  }, [copyToClipboard, seed]);

  const submit = useCallback(async (): Promise<boolean> => {
    setError('');

    if (!seed) {
      setError('No recovery phrase was generated. Go back and try again.');
      return false;
    }

    const invalid = validatePassword(password, confirm);
    if (invalid) {
      setError(invalid);
      return false;
    }

    setIsSubmitting(true);
    setIsCreating(true);
    try {
      // One path only. This used to fork on `isAuthenticated && user` into an
      // "additional account" branch that handed the seed to secureTransfer and
      // sent the user to the import screen. That branch is gone: the navigation
      // effect above redirects an authenticated user away on mount, so it was
      // unreachable, and it could not have worked if reached — `addAccount()`
      // takes no hasBackup argument and hardcodes `false`, the import screen
      // would have had to paint the received phrase into a visible textarea
      // (defeating the point of an in-memory transfer), and it discarded the
      // password the user had just set in favour of the master password.
      //
      // Adding a second account is served by Account Manager → Import, which
      // never went through here.
      //
      // hasBackup: true — claimed by the user pressing "I've saved it", which
      // `goTo` only lets them reach once the phrase has been revealed.
      await create(seed.phrase, password, 'My Account', true);
      // Let React flush the auth state before the navigation effect runs.
      await new Promise((resolve) => setTimeout(resolve, 100));
      setIsCreating(false);
      setIsSubmitting(false);
      return true;
    } catch (err) {
      logger.error('[CreateWallet] creation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setIsSubmitting(false);
      setIsCreating(false);
      return false;
    }
  }, [confirm, create, password, seed]);

  return {
    canGoBack,
    confirm,
    copyPhrase,
    error,
    goBack,
    goTo,
    isCopied,
    isGoingBack,
    isLedgerAvailable,
    isRevealed,
    isSubmitting,
    password,
    regenerateSeed,
    reveal,
    seedError: seedState.seedError,
    setConfirm,
    setPassword,
    step,
    submit,
    words: seedState.words,
  };
}
