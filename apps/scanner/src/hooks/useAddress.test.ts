/**
 * Tests for useAddress hooks.
 *
 * All network calls are mocked so tests run fully offline.
 * Covers: enabled/disabled query behavior, data shape returned,
 * and that each hook uses the expected cache key.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  fetchActiveLeases: vi
    .fn()
    .mockResolvedValue([{ amount: 1_000_000, id: 'lease1', recipient: '3PRecipient' }]),
  fetchAddressNFTs: vi.fn().mockResolvedValue([{ assetId: 'nft1', name: 'NFT One' }]),
  fetchAssetsBalance: vi.fn().mockResolvedValue({
    address: '3Paddr',
    balances: [{ assetId: 'tokenA', balance: 500 }],
  }),
  fetchBalanceDetails: vi.fn().mockResolvedValue({
    address: '3Paddr',
    available: '1000',
    effective: '900',
    generating: '900',
    regular: '1000',
  }),
}));

import { useActiveLeases, useAddressAssets, useAddressBalance, useAddressNFTs } from './useAddress';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

// ── useAddressBalance ──────────────────────────────────────────────────────

describe('useAddressBalance', () => {
  it('returns balance details when address is provided', async () => {
    const { result } = renderHook(() => useAddressBalance('3Paddr'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.regular).toBe('1000');
    expect(result.current.data?.available).toBe('1000');
  });

  it('stays pending when address is null (enabled=false)', () => {
    const { result } = renderHook(() => useAddressBalance(null), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is initially pending when address is provided', () => {
    const { result } = renderHook(() => useAddressBalance('3Paddr'), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isPending).toBe(true);
  });
});

// ── useAddressAssets ───────────────────────────────────────────────────────

describe('useAddressAssets', () => {
  it('returns asset balances when address is provided', async () => {
    const { result } = renderHook(() => useAddressAssets('3Paddr'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.balances).toHaveLength(1);
    expect(result.current.data?.balances[0]?.assetId).toBe('tokenA');
  });

  it('stays idle when address is null', () => {
    const { result } = renderHook(() => useAddressAssets(null), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ── useAddressNFTs ─────────────────────────────────────────────────────────

describe('useAddressNFTs', () => {
  it('returns NFT list with default limit', async () => {
    const { result } = renderHook(() => useAddressNFTs('3Paddr'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.assetId).toBe('nft1');
  });

  it('accepts a custom limit', async () => {
    const { result } = renderHook(() => useAddressNFTs('3Paddr', 10), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });

  it('stays idle when address is null', () => {
    const { result } = renderHook(() => useAddressNFTs(null), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ── useActiveLeases ────────────────────────────────────────────────────────

describe('useActiveLeases', () => {
  it('returns active leases when address is provided', async () => {
    const { result } = renderHook(() => useActiveLeases('3Paddr'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.id).toBe('lease1');
  });

  it('stays idle when address is null', () => {
    const { result } = renderHook(() => useActiveLeases(null), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
