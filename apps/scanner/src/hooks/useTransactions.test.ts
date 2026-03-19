/**
 * Tests for useTransactions hooks.
 *
 * Covers: useTransaction (confirmed + unconfirmed fallthrough),
 * useAddressTransactions, useUnconfirmedTransactions.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

const { mockFetchInfo, mockFetchUnconfirmedInfo, mockFetchAddressTxs, mockFetchUnconfirmed } =
  vi.hoisted(() => ({
    mockFetchAddressTxs: vi
      .fn()
      .mockResolvedValue([{ fee: 100_000, height: 50, id: 'addrTx1', type: 4 }]),
    mockFetchInfo: vi.fn().mockResolvedValue({ fee: 100_000, height: 10, id: 'tx1', type: 4 }),
    mockFetchUnconfirmed: vi.fn().mockResolvedValue([{ id: 'utx1', type: 4 }]),
    mockFetchUnconfirmedInfo: vi.fn().mockResolvedValue({ id: 'utx2', type: 4 }),
  }));

vi.mock('@/lib/api', () => ({
  fetchAddressTransactions: mockFetchAddressTxs,
  fetchTransactionInfo: mockFetchInfo,
  fetchUnconfirmedTransactionInfo: mockFetchUnconfirmedInfo,
  fetchUnconfirmedTransactions: mockFetchUnconfirmed,
}));

import {
  useAddressTransactions,
  useTransaction,
  useUnconfirmedTransactions,
} from './useTransactions';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

// ── useTransaction ─────────────────────────────────────────────────────────

describe('useTransaction', () => {
  it('returns confirmed transaction when found', async () => {
    const { result } = renderHook(() => useTransaction('tx1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('tx1');
  });

  it('falls through to unconfirmed when confirmed fetch throws', async () => {
    mockFetchInfo.mockRejectedValueOnce(new Error('not found'));
    const { result } = renderHook(() => useTransaction('utx2'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('utx2');
  });

  it('returns null when neither pool has the transaction', async () => {
    mockFetchInfo.mockRejectedValueOnce(new Error('not found'));
    mockFetchUnconfirmedInfo.mockRejectedValueOnce(new Error('not found'));
    const { result } = renderHook(() => useTransaction('missing'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('stays idle when id is null', () => {
    const { result } = renderHook(() => useTransaction(null), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('stays idle when id is empty string', () => {
    const { result } = renderHook(() => useTransaction(''), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ── useAddressTransactions ─────────────────────────────────────────────────

describe('useAddressTransactions', () => {
  it('returns address transactions with default limit', async () => {
    const { result } = renderHook(() => useAddressTransactions('3Paddr'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.id).toBe('addrTx1');
  });

  it('accepts custom limit', async () => {
    const { result } = renderHook(() => useAddressTransactions('3Paddr', 10), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });

  it('stays idle when address is null', () => {
    const { result } = renderHook(() => useAddressTransactions(null), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ── useUnconfirmedTransactions ─────────────────────────────────────────────

describe('useUnconfirmedTransactions', () => {
  it('returns unconfirmed transactions', async () => {
    const { result } = renderHook(() => useUnconfirmedTransactions(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data?.[0]?.id).toBe('utx1');
  });
});
