/**
 * State and side effects for the create-wallet wizard.
 *
 * Everything that touches Seed, AuthContext or the router lives here so the
 * step components stay presentational and this can be tested without rendering
 * a wizard. Behaviour is carried over from the screen this replaces, with one
 * change: `hasBackup` is now earned by passing verification rather than by
 * ticking a checkbox.
 */
import { Seed } from 'data-service/classes/Seed';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useClipboard } from '@/hooks/useClipboard';
import { logger } from '@/lib/logger';
import { buildChallenges, type VerifyChallenge } from './verification';

export interface CreateWalletApi {
  words: string[];
  challenges: VerifyChallenge[];
  isLedgerSupported: boolean;
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
  regenerateSeed: () => void;
  /** Marks the phrase as revealed. Idempotent; safe to call more than once. */
  reveal: () => void;
  copyPhrase: () => Promise<void>;
  submit: (password: string, confirm: string) => Promise<boolean>;
}

interface SeedState {
  seed: Seed | null;
  seedError: string;
}

/**
 * Generate a fresh seed phrase, guarding against Seed.create() throwing.
 *
 * A module-level function (rather than inline in the hook) so the initial
 * generation — via useState's lazy initializer — and an explicit retry via
 * regenerateSeed can share it without a hook dependency ever needing to
 * "reference" a retry counter just to justify re-running it.
 */
function generateSeedState(): SeedState {
  try {
    return { seed: Seed.create(), seedError: '' };
  } catch (err) {
    logger.error('[CreateWallet] seed generation failed:', err);
    return { seed: null, seedError: 'Could not generate a recovery phrase. Try again.' };
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

  const { create, user, isAuthenticated, getActiveState } = useAuth();
  const { isCopied, copyToClipboard } = useClipboard();
  const navigate = useNavigate();

  const words = useMemo(() => (seed ? seed.phrase.split(' ') : []), [seed]);
  const challenges = useMemo(() => buildChallenges(words), [words]);
  const regenerateSeed = useCallback(() => setSeedState(generateSeedState()), []);
  const reveal = useCallback(() => setIsRevealed(true), []);

  // WebHID, so Chrome and Edge only.
  const isLedgerSupported = typeof navigator !== 'undefined' && 'hid' in navigator;

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

  const submit = useCallback(
    async (password: string, confirm: string): Promise<boolean> => {
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
        if (isAuthenticated && user) {
          // Additional account: the vault must be unlocked first. The seed is
          // handed over in memory, never through router state, which would
          // persist it in browser history.
          const { setSeedTransfer } = await import('@/lib/secureTransfer');
          setSeedTransfer(seed.phrase);
          setIsCreating(false);
          setIsSubmitting(false);
          void navigate('/auth/import', {
            state: { hasBackup: true, hasSeedTransfer: true, name: 'My Account' },
          });
          return true;
        }

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
    },
    [create, isAuthenticated, navigate, seed, user],
  );

  return {
    challenges,
    copyPhrase,
    error,
    isCopied,
    isLedgerSupported,
    isRevealed,
    isSubmitting,
    regenerateSeed,
    reveal,
    seedError: seedState.seedError,
    submit,
    words,
  };
}
