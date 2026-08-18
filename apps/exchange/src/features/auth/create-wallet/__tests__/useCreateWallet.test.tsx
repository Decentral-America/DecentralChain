/**
 * useCreateWallet — unit tests
 *
 * Covers password validation (the rules are unchanged from the screen this
 * replaces), that a failed submit surfaces an error without losing the
 * generated phrase, and the two gates the hook owns: the password step is
 * unreachable until the phrase has been revealed, and Ledger is offered only
 * when the feature flag and WebHID agree.
 */
import { act, type RenderHookResult, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type CreateWalletApi, STEP, useCreateWallet, validatePassword } from '../useCreateWallet';

const create = vi.fn();
const navigate = vi.fn();

// Mutable behind a getter: the hook reads config.ledgerEnabled on every render,
// so a per-test flip is enough and no module reset is needed.
const ledgerFlag = vi.hoisted(() => ({ enabled: false }));

// Mutable so a test can put the hook in the "already authenticated" state and
// assert the redirect that keeps the wizard out of an authenticated session.
const authState: { isAuthenticated: boolean; user: { id: string } | null } = {
  isAuthenticated: false,
  user: null,
};

vi.mock('@/config', () => ({
  config: {
    get ledgerEnabled() {
      return ledgerFlag.enabled;
    },
  },
}));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    create,
    getActiveState: () => '/desktop/wallet',
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
  }),
}));
vi.mock('react-router', () => ({ useNavigate: () => navigate }));
vi.mock('@/hooks/useClipboard', () => ({
  useClipboard: () => ({ copyToClipboard: vi.fn(), isCopied: false }),
}));
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));
vi.mock('data-service/classes/Seed', () => ({
  Seed: { create: vi.fn(() => ({ phrase: 'a b c d e f g h i j k l m n o' })) },
}));

describe('validatePassword', () => {
  it('rejects an empty password', () => {
    expect(validatePassword('', '')).toBe('Please enter a password');
  });

  it('rejects a password under 12 characters', () => {
    expect(validatePassword('Ab1!short', 'Ab1!short')).toBe(
      'Password must be at least 12 characters',
    );
  });

  it('rejects a password missing a character class', () => {
    const message = 'Password must contain uppercase, lowercase, a digit, and a special character';
    expect(validatePassword('abcdefghijkl', 'abcdefghijkl')).toBe(message);
    expect(validatePassword('ABCDEFGHIJKL', 'ABCDEFGHIJKL')).toBe(message);
    expect(validatePassword('Abcdefghijkl', 'Abcdefghijkl')).toBe(message);
    expect(validatePassword('Abcdefghijk1', 'Abcdefghijk1')).toBe(message);
  });

  it('rejects a mismatched confirmation', () => {
    expect(validatePassword('Abcdefghijk1!', 'Abcdefghijk2!')).toBe('Passwords do not match');
  });

  it('accepts a valid password', () => {
    expect(validatePassword('Abcdefghijk1!', 'Abcdefghijk1!')).toBeNull();
  });
});

type Rendered = RenderHookResult<CreateWalletApi, unknown>;

/**
 * Fill the password fields, then submit. The fields live in the hook now — the
 * password step is remounted on every navigation, so local state there would
 * be emptied by a trip back to re-read the phrase.
 */
const submitWith = async (
  { result }: Rendered,
  password: string,
  confirm: string = password,
): Promise<boolean | undefined> => {
  act(() => {
    result.current.setPassword(password);
    result.current.setConfirm(confirm);
  });
  let ok: boolean | undefined;
  await act(async () => {
    ok = await result.current.submit();
  });
  return ok;
};

/** Add or remove WebHID the way a Chrome/Safari split would. */
const setWebHid = (present: boolean) => {
  if (present) {
    Object.defineProperty(navigator, 'hid', { configurable: true, value: {} });
  } else {
    Reflect.deleteProperty(navigator, 'hid');
  }
};

describe('useCreateWallet', () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    authState.user = null;
    create.mockReset();
    navigate.mockReset();
    ledgerFlag.enabled = false;
    setWebHid(false);
  });

  afterEach(() => {
    setWebHid(false);
  });

  it('exposes the generated phrase as words', () => {
    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.words).toHaveLength(15);
    expect(result.current.words[0]).toBe('a');
  });

  it('keeps the same phrase across re-renders', () => {
    const { result, rerender } = renderHook(() => useCreateWallet());
    const first = result.current.words.join(' ');
    rerender();
    expect(result.current.words.join(' ')).toBe(first);
  });

  it('rejects an invalid password without calling create', async () => {
    const rendered = renderHook(() => useCreateWallet());
    const ok = await submitWith(rendered, 'short');
    expect(ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
    expect(rendered.result.current.error).toBe('Password must be at least 12 characters');
  });

  it('creates the wallet with hasBackup true when the password is valid', async () => {
    create.mockResolvedValue(undefined);
    const rendered = renderHook(() => useCreateWallet());
    await submitWith(rendered, 'Abcdefghijk1!');
    expect(create).toHaveBeenCalledWith(
      'a b c d e f g h i j k l m n o',
      'Abcdefghijk1!',
      'My Account',
      true,
    );
  });

  it('reports a seed generation failure instead of crashing', async () => {
    const { Seed } = await import('data-service/classes/Seed');
    vi.mocked(Seed.create).mockImplementationOnce(() => {
      throw new Error('entropy unavailable');
    });
    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.seedError).toMatch(/could not generate/i);
    expect(result.current.words).toEqual([]);
  });

  it('surfaces a creation failure as an error and preserves the phrase', async () => {
    create.mockRejectedValue(new Error('vault locked'));
    const rendered = renderHook(() => useCreateWallet());
    const ok = await submitWith(rendered, 'Abcdefghijk1!');
    expect(ok).toBe(false);
    expect(rendered.result.current.error).toBe('vault locked');
    expect(rendered.result.current.words).toHaveLength(15);
  });

  it('redirects an already-authenticated user away instead of running the wizard', () => {
    // This redirect is why `submit()` has a single path. It used to fork into
    // an "additional account" branch on exactly this state, which the redirect
    // made unreachable; the branch is gone, and this is the guarantee that it
    // stays unreachable if anyone reaches for it again. Adding a second account
    // goes through Account Manager → Import instead.
    authState.isAuthenticated = true;
    authState.user = { id: 'existing-user' };

    renderHook(() => useCreateWallet());

    expect(navigate).toHaveBeenCalledWith('/desktop/wallet', { replace: true });
  });

  it('produces a fresh phrase when regenerateSeed is called', async () => {
    const { Seed } = await import('data-service/classes/Seed');
    const { result } = renderHook(() => useCreateWallet());
    const first = result.current.words.join(' ');

    vi.mocked(Seed.create).mockReturnValueOnce({
      phrase: 'p q r s t u v w x y z aa bb cc dd',
    } as unknown as ReturnType<typeof Seed.create>);

    act(() => {
      result.current.regenerateSeed();
    });

    expect(result.current.words.join(' ')).not.toBe(first);
    expect(result.current.words.join(' ')).toBe('p q r s t u v w x y z aa bb cc dd');
  });

  it('recovers from a generation failure when regenerateSeed is called', async () => {
    // regenerateSeed is the only way out of a failed Seed.create(): without it
    // the user is left on a step with no phrase and nothing to press.
    const { Seed } = await import('data-service/classes/Seed');
    vi.mocked(Seed.create).mockImplementationOnce(() => {
      throw new Error('entropy unavailable');
    });

    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.seedError).toMatch(/could not generate/i);
    expect(result.current.words).toEqual([]);

    act(() => {
      result.current.regenerateSeed();
    });

    expect(result.current.seedError).toBe('');
    expect(result.current.words).toHaveLength(15);
  });

  it('clears isRevealed when regenerateSeed is called', () => {
    const { result } = renderHook(() => useCreateWallet());
    act(() => {
      result.current.reveal();
    });
    expect(result.current.isRevealed).toBe(true);

    act(() => {
      result.current.regenerateSeed();
    });

    // A phrase nobody has seen must not be presented as already written down.
    expect(result.current.isRevealed).toBe(false);
  });

  it('tracks the step index and reports whether back is available', () => {
    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.step).toBe(STEP.INTRO);
    expect(result.current.canGoBack).toBe(false);

    act(() => {
      // The password step is gated on the reveal, so this is what a user who
      // has read their phrase can do.
      result.current.reveal();
    });
    act(() => {
      result.current.goTo(STEP.SECURE);
    });
    expect(result.current.step).toBe(STEP.SECURE);
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.isGoingBack).toBe(false);

    act(() => {
      result.current.goBack();
    });
    expect(result.current.step).toBe(STEP.PHRASE);
    expect(result.current.isGoingBack).toBe(true);
  });

  it('refuses to reach the password step before the phrase has been revealed', () => {
    const { result } = renderHook(() => useCreateWallet());
    act(() => {
      result.current.goTo(STEP.PHRASE);
    });

    act(() => {
      result.current.goTo(STEP.SECURE);
    });

    // hasBackup: true rests on nothing but this reveal now that verification is
    // gone, so a user who never saw the words must not reach the password step.
    expect(result.current.step).toBe(STEP.PHRASE);

    act(() => {
      result.current.reveal();
    });
    act(() => {
      result.current.goTo(STEP.SECURE);
    });
    expect(result.current.step).toBe(STEP.SECURE);
  });

  it('does not step back past the first step', () => {
    const { result } = renderHook(() => useCreateWallet());
    act(() => {
      result.current.goBack();
    });
    expect(result.current.step).toBe(0);
  });

  it('keeps the password fields across a step change but drops the error', async () => {
    create.mockRejectedValue(new Error('vault locked'));
    const rendered = renderHook(() => useCreateWallet());
    await submitWith(rendered, 'Abcdefghijk1!');
    expect(rendered.result.current.error).toBe('vault locked');

    act(() => {
      rendered.result.current.goTo(STEP.PHRASE);
    });

    expect(rendered.result.current.error).toBe('');
    expect(rendered.result.current.password).toBe('Abcdefghijk1!');
    expect(rendered.result.current.confirm).toBe('Abcdefghijk1!');
  });

  it('hides Ledger while the feature flag is off, even in a WebHID browser', () => {
    ledgerFlag.enabled = false;
    setWebHid(true);
    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.isLedgerAvailable).toBe(false);
  });

  it('hides Ledger in a browser without WebHID, even with the flag on', () => {
    ledgerFlag.enabled = true;
    setWebHid(false);
    const { result } = renderHook(() => useCreateWallet());
    // Offering it here would dead-end on click: there is no transport.
    expect(result.current.isLedgerAvailable).toBe(false);
  });

  it('offers Ledger only when the flag is on and WebHID is available', () => {
    ledgerFlag.enabled = true;
    setWebHid(true);
    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.isLedgerAvailable).toBe(true);
  });
});
