/**
 * Tests for useBlocks hooks.
 *
 * Covers: useBlockAt, useBlockById, useBlockHeaders — enabled/disabled
 * behavior, data shape, and refetchInterval option passthrough.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

const { mockBlock, mockHeader } = vi.hoisted(() => ({
  mockBlock: {
    generator: '3PGen',
    height: 500,
    id: 'block500',
    reward: 600_000_000,
    signature: 'sig500',
    timestamp: 1_700_000_000_000,
    transactionCount: 7,
    transactions: [],
    version: 5,
  },
  mockHeader: {
    generator: '3PGen',
    height: 500,
    id: 'block500',
    signature: 'sig500',
    timestamp: 1_700_000_000_000,
    transactionCount: 7,
  },
}));

vi.mock('@/lib/api', () => ({
  fetchBlockAt: vi.fn().mockResolvedValue(mockBlock),
  fetchBlockById: vi.fn().mockResolvedValue(mockBlock),
  fetchBlockHeadersSeq: vi.fn().mockResolvedValue([mockHeader]),
}));

import { useBlockAt, useBlockById, useBlockHeaders } from './useBlocks';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

// ── useBlockAt ─────────────────────────────────────────────────────────────

describe('useBlockAt', () => {
  it('returns block data when height is provided', async () => {
    const { result } = renderHook(() => useBlockAt(500), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.height).toBe(500);
    expect(result.current.data?.id).toBe('block500');
  });

  it('stays idle when height is null', () => {
    const { result } = renderHook(() => useBlockAt(null), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('stays idle when height is 0 (falsy to the enabled guard)', () => {
    const { result } = renderHook(() => useBlockAt(0), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is initially pending when height is provided', () => {
    const { result } = renderHook(() => useBlockAt(500), { wrapper: makeWrapper() });
    expect(result.current.isPending).toBe(true);
  });
});

// ── useBlockById ───────────────────────────────────────────────────────────

describe('useBlockById', () => {
  it('returns block data when id is provided', async () => {
    const { result } = renderHook(() => useBlockById('block500'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('block500');
    expect(result.current.data?.height).toBe(500);
  });

  it('stays idle when id is null', () => {
    const { result } = renderHook(() => useBlockById(null), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('stays idle when id is empty string', () => {
    const { result } = renderHook(() => useBlockById(''), { wrapper: makeWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ── useBlockHeaders ────────────────────────────────────────────────────────

describe('useBlockHeaders', () => {
  it('returns block headers for a range', async () => {
    const { result } = renderHook(() => useBlockHeaders(490, 500), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data?.[0]?.height).toBe(500);
  });

  it('stays idle when enabled=false', () => {
    const { result } = renderHook(() => useBlockHeaders(490, 500, { enabled: false }), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('stays idle when from range is 0', () => {
    const { result } = renderHook(() => useBlockHeaders(0, 10), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('stays idle when to < from', () => {
    const { result } = renderHook(() => useBlockHeaders(100, 50), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('accepts refetchInterval option', async () => {
    const { result } = renderHook(() => useBlockHeaders(490, 500, { refetchInterval: 5000 }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
