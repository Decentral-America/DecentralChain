/**
 * DCC-111 — useBlockPolling hook smoke tests.
 *
 * Verifies enabled/disabled behavior and that the hooks invoke the expected
 * API functions.  All network calls are mocked so tests run fully offline.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

// ── mock API ───────────────────────────────────────────────────────────────
vi.mock('@/lib/api', () => ({
  fetchHeight: vi.fn().mockResolvedValue({ height: 99 }),
  fetchLastBlock: vi.fn().mockResolvedValue({
    desiredReward: 600_000_000,
    generator: '3P3FfgF5f1WxS4jbUMqojfC3xBnrGNrMePy',
    height: 99,
    id: 'block99',
    reward: 600_000_000,
    signature: 'sig99',
    timestamp: 1_700_000_000_000,
    transactionCount: 2,
    transactions: [],
    version: 5,
  }),
}));

import { useBlockHeight, useLatestBlock } from './useBlockPolling';

// ── factory ────────────────────────────────────────────────────────────────
function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // Disable refetch to prevent test interference
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('useBlockHeight', () => {
  it('returns height data when enabled', async () => {
    const { result } = renderHook(() => useBlockHeight(true), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.height).toBe(99);
  });

  it('still resolves data when enabled=false (no polling, but initial fetch fires)', async () => {
    const { result } = renderHook(() => useBlockHeight(false), {
      wrapper: makeWrapper(),
    });

    // enabled=false only disables refetchInterval, not the initial query
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.height).toBe(99);
  });

  it('exposes isLoading while fetching', () => {
    const { result } = renderHook(() => useBlockHeight(true), {
      wrapper: makeWrapper(),
    });

    // Immediately after mount — before settle
    expect(result.current.isPending).toBe(true);
  });
});

describe('useLatestBlock', () => {
  it('returns block data when enabled', async () => {
    const { result } = renderHook(() => useLatestBlock(true), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.height).toBe(99);
    expect(result.current.data?.id).toBe('block99');
  });

  it('still resolves data when enabled=false (no polling, but initial fetch fires)', async () => {
    const { result } = renderHook(() => useLatestBlock(false), {
      wrapper: makeWrapper(),
    });

    // enabled=false only disables refetchInterval, not the initial query
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.height).toBe(99);
  });

  it('returns generator address in block', async () => {
    const { result } = renderHook(() => useLatestBlock(true), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.generator).toBe('3P3FfgF5f1WxS4jbUMqojfC3xBnrGNrMePy');
  });
});
