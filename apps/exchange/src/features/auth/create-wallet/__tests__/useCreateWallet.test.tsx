/**
 * useCreateWallet — unit tests
 *
 * Covers password validation (the rules are unchanged from the screen this
 * replaces) and that a failed submit surfaces an error without losing the
 * generated phrase.
 */
import { act, type RenderHookResult, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type CreateWalletApi, useCreateWallet, validatePassword } from '../useCreateWallet';

const create = vi.fn();
const navigate = vi.fn();
const setSeedTransfer = vi.fn();

// Mutable so individual tests can flip to the "already authenticated, adding
// an additional account" state without redefining the whole mock.
const authState: { isAuthenticated: boolean; user: { id: string } | null } = {
  isAuthenticated: false,
  user: null,
};

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
vi.mock('@/lib/secureTransfer', () => ({ setSeedTransfer }));
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

describe('useCreateWallet', () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    authState.user = null;
    create.mockReset();
    navigate.mockReset();
    setSeedTransfer.mockReset();
  });

  it('exposes the generated phrase as words', () => {
    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.words).toHaveLength(15);
    expect(result.current.words[0]).toBe('a');
  });

  it('builds verification challenges from the phrase', () => {
    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.challenges).toHaveLength(3);
    for (const c of result.current.challenges) {
      expect(result.current.words).toContain(c.answer);
    }
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

  it('hands the seed to secureTransfer instead of calling create, when already authenticated', async () => {
    authState.isAuthenticated = true;
    authState.user = { id: 'existing-user' };
    const rendered = renderHook(() => useCreateWallet());

    const ok = await submitWith(rendered, 'Abcdefghijk1!');

    expect(ok).toBe(true);
    expect(setSeedTransfer).toHaveBeenCalledWith('a b c d e f g h i j k l m n o');
    expect(create).not.toHaveBeenCalled();
  });

  it('never puts the seed phrase into router state for the additional-account navigation', async () => {
    authState.isAuthenticated = true;
    authState.user = { id: 'existing-user' };
    const rendered = renderHook(() => useCreateWallet());

    await submitWith(rendered, 'Abcdefghijk1!');

    // The seed must reach the next screen only via setSeedTransfer (asserted
    // above), never via router state — router state persists in browser
    // history, which would leak the recovery phrase.
    const importCall = navigate.mock.calls.find(([path]) => path === '/auth/import');
    expect(importCall).toBeDefined();
    const [, options] = importCall as [string, { state: Record<string, unknown> }];

    expect(options.state).toEqual({
      hasBackup: true,
      hasSeedTransfer: true,
      name: 'My Account',
    });

    const phrase = 'a b c d e f g h i j k l m n o';
    for (const value of Object.values(options.state)) {
      expect(String(value)).not.toContain(phrase);
    }
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
    expect(result.current.challenges).toEqual([]);

    act(() => {
      result.current.regenerateSeed();
    });

    expect(result.current.seedError).toBe('');
    expect(result.current.words).toHaveLength(15);
    expect(result.current.challenges).toHaveLength(3);
  });

  it('rebuilds the challenges for the new phrase after regenerateSeed', async () => {
    const { Seed } = await import('data-service/classes/Seed');
    const { result } = renderHook(() => useCreateWallet());

    vi.mocked(Seed.create).mockReturnValueOnce({
      phrase: 'p q r s t u v w x y z aa bb cc dd',
    } as unknown as ReturnType<typeof Seed.create>);

    act(() => {
      result.current.regenerateSeed();
    });

    // Challenges answerable only against the *old* phrase would lock the user
    // out of a wizard they can no longer complete.
    for (const c of result.current.challenges) {
      expect(result.current.words).toContain(c.answer);
      expect(result.current.words[c.position - 1]).toBe(c.answer);
    }
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

  it('keeps the same challenges across re-renders', () => {
    const { result, rerender } = renderHook(() => useCreateWallet());
    const first = result.current.challenges;
    rerender();
    // Reshuffled questions mid-verification would move the goalposts under a
    // user who is halfway through answering them.
    expect(result.current.challenges).toBe(first);
  });

  it('tracks the step index and reports whether back is available', () => {
    const { result } = renderHook(() => useCreateWallet());
    expect(result.current.step).toBe(0);
    expect(result.current.canGoBack).toBe(false);

    act(() => {
      result.current.goTo(2);
    });
    expect(result.current.step).toBe(2);
    expect(result.current.canGoBack).toBe(true);
    expect(result.current.isGoingBack).toBe(false);

    act(() => {
      result.current.goBack();
    });
    expect(result.current.step).toBe(1);
    expect(result.current.isGoingBack).toBe(true);
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
      rendered.result.current.goTo(2);
    });

    expect(rendered.result.current.error).toBe('');
    expect(rendered.result.current.password).toBe('Abcdefghijk1!');
    expect(rendered.result.current.confirm).toBe('Abcdefghijk1!');
  });
});
