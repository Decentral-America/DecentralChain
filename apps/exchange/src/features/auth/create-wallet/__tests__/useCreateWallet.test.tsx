/**
 * useCreateWallet — unit tests
 *
 * Covers password validation (the rules are unchanged from the screen this
 * replaces) and that a failed submit surfaces an error without losing the
 * generated phrase.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateWallet, validatePassword } from '../useCreateWallet';

const create = vi.fn();
const navigate = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    create,
    getActiveState: () => '/desktop/wallet',
    isAuthenticated: false,
    user: null,
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

describe('useCreateWallet', () => {
  beforeEach(() => {
    create.mockReset();
    navigate.mockReset();
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
    const { result } = renderHook(() => useCreateWallet());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.submit('short', 'short');
    });
    expect(ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Password must be at least 12 characters');
  });

  it('creates the wallet with hasBackup true when the password is valid', async () => {
    create.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCreateWallet());
    await act(async () => {
      await result.current.submit('Abcdefghijk1!', 'Abcdefghijk1!');
    });
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
    const { result } = renderHook(() => useCreateWallet());
    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.submit('Abcdefghijk1!', 'Abcdefghijk1!');
    });
    expect(ok).toBe(false);
    expect(result.current.error).toBe('vault locked');
    expect(result.current.words).toHaveLength(15);
  });
});
