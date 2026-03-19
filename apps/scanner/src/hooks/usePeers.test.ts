/**
 * Tests for usePeers hooks.
 *
 * Covers: useConnectedPeers, useAllPeers, useSuspendedPeers, useBlacklist —
 * data shapes and fetch behavior.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  fetchAllPeers: vi.fn().mockResolvedValue({
    peers: [{ address: '/1.2.3.4:6868', lastSeen: 1_700_000_000_000 }],
  }),
  fetchBlacklistedPeers: vi
    .fn()
    .mockResolvedValue([{ hostname: '/5.5.5.5:6868', reason: 'flooding' }]),
  fetchConnectedPeers: vi.fn().mockResolvedValue({
    peers: [{ address: '/1.2.3.4:6868', applicationName: 'waves' }],
  }),
  fetchSuspendedPeers: vi
    .fn()
    .mockResolvedValue([{ hostname: '/9.9.9.9:6868', suspensionTime: 60000 }]),
}));

import { useAllPeers, useBlacklist, useConnectedPeers, useSuspendedPeers } from './usePeers';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe('useConnectedPeers', () => {
  it('returns connected peers array', async () => {
    const { result } = renderHook(() => useConnectedPeers(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data?.peers)).toBe(true);
    expect(result.current.data?.peers).toHaveLength(1);
    expect(result.current.data?.peers[0]?.address).toBe('/1.2.3.4:6868');
  });

  it('is initially pending', () => {
    const { result } = renderHook(() => useConnectedPeers(), { wrapper: makeWrapper() });
    expect(result.current.isPending).toBe(true);
  });
});

describe('useAllPeers', () => {
  it('returns full peer list', async () => {
    const { result } = renderHook(() => useAllPeers(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data?.peers)).toBe(true);
    expect(result.current.data?.peers[0]?.address).toBe('/1.2.3.4:6868');
  });
});

describe('useSuspendedPeers', () => {
  it('returns suspended peers array', async () => {
    const { result } = renderHook(() => useSuspendedPeers(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data?.[0]?.hostname).toBe('/9.9.9.9:6868');
  });
});

describe('useBlacklist', () => {
  it('returns blacklisted peers array', async () => {
    const { result } = renderHook(() => useBlacklist(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data?.[0]?.hostname).toBe('/5.5.5.5:6868');
    expect(result.current.data?.[0]?.reason).toBe('flooding');
  });
});
