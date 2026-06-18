/**
 * Tests for useFaucetHistory hook.
 *
 * Covers: initial load from localStorage, addEntry persistence, MAX_ENTRIES cap,
 * graceful degradation when localStorage is unavailable (SSR / private mode),
 * and the isLoading lifecycle.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type FaucetEntry, useFaucetHistory } from './useFaucetHistory';

const STORAGE_KEY = 'dcc_faucet_history';

function makeEntry(n: number): FaucetEntry {
  return { address: `addr${n}`, amount: n * 100, txId: `tx${n}` };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useFaucetHistory', () => {
  it('loads an empty history when localStorage has no entry', async () => {
    const { result } = renderHook(() => useFaucetHistory());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.history).toHaveLength(0);
  });

  it('loads persisted entries from localStorage on mount', async () => {
    const stored = [makeEntry(1), makeEntry(2)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useFaucetHistory());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0]).toEqual(stored[0]);
  });

  it('returns an empty history when localStorage contains invalid JSON', async () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');

    const { result } = renderHook(() => useFaucetHistory());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.history).toHaveLength(0);
  });

  it('addEntry prepends the new entry and persists it to localStorage', async () => {
    const { result } = renderHook(() => useFaucetHistory());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const entry = makeEntry(1);
    act(() => {
      result.current.addEntry(entry);
    });

    expect(result.current.history[0]).toEqual(entry);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as FaucetEntry[];
    expect(persisted[0]).toEqual(entry);
  });

  it('respects MAX_ENTRIES (20) — the last stored entry is evicted when adding to a full list', async () => {
    // Store 20 entries in ascending order [makeEntry(1), ..., makeEntry(20)].
    // addEntry prepends, so after slicing to 20 the last entry (makeEntry(20)) is dropped.
    const initial = Array.from({ length: 20 }, (_, i) => makeEntry(i + 1));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));

    const { result } = renderHook(() => useFaucetHistory());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const overflow = makeEntry(99);
    act(() => {
      result.current.addEntry(overflow);
    });

    expect(result.current.history).toHaveLength(20);
    expect(result.current.history[0]).toEqual(overflow);
    // makeEntry(20) is the last element in the original array — it falls off after slicing
    expect(result.current.history.find((e) => e.txId === 'tx20')).toBeUndefined();
    // makeEntry(1) is still present (position [19] → [1] after prepend)
    expect(result.current.history.find((e) => e.txId === 'tx1')).toBeDefined();
  });

  it('handles localStorage.setItem throwing (e.g. private mode quota)', async () => {
    const { result } = renderHook(() => useFaucetHistory());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    expect(() => {
      act(() => {
        result.current.addEntry(makeEntry(1));
      });
    }).not.toThrow();

    // In-memory state is still updated even when persistence fails
    expect(result.current.history).toHaveLength(1);
  });
});
