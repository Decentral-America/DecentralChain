/**
 * Tests for useAssetDetails hook.
 *
 * Verifies enabled/disabled behavior and that asset data is returned
 * correctly when an assetId is provided.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  fetchAssetDetailsById: vi.fn().mockResolvedValue({
    assetId: 'ASSET1',
    decimals: 8,
    description: 'Test asset',
    issuer: '3PIssuer',
    name: 'TestToken',
    quantity: '1000000000',
    reissuable: false,
  }),
}));

import { useAssetDetails } from './useAssets';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe('useAssetDetails', () => {
  it('returns asset details when assetId is provided', async () => {
    const { result } = renderHook(() => useAssetDetails('ASSET1'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.assetId).toBe('ASSET1');
    expect(result.current.data?.name).toBe('TestToken');
    expect(result.current.data?.decimals).toBe(8);
  });

  it('stays idle when assetId is null (enabled=false)', () => {
    const { result } = renderHook(() => useAssetDetails(null), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('is initially pending when assetId is provided', () => {
    const { result } = renderHook(() => useAssetDetails('ASSET1'), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isPending).toBe(true);
  });
});
