import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const fetchMatcherPairs = vi.hoisted(() => vi.fn());
vi.mock('../matcherMarkets', () => ({ fetchMatcherPairs }));

import { useAvailablePairs } from '../useAvailablePairs';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

describe('useAvailablePairs', () => {
  it('lists the matcher markets and defaults to the first one on matcher networks', async () => {
    fetchMatcherPairs.mockResolvedValueOnce([
      { amountAsset: 'A1', amountAssetName: 'AUDT', priceAsset: 'DCC', priceAssetName: 'DCC' },
    ]);
    const { result } = renderHook(() => useAvailablePairs('matcher'), { wrapper });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.pairs).toHaveLength(1);
    expect(result.current.defaultPair?.amountAsset).toBe('A1');
  });

  it('reports no default pair while the matcher lists nothing visible', async () => {
    fetchMatcherPairs.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useAvailablePairs('matcher'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.pairs).toEqual([]);
    expect(result.current.defaultPair).toBeNull();
  });

  it('never calls the matcher on config networks', () => {
    fetchMatcherPairs.mockClear();
    const { result } = renderHook(() => useAvailablePairs('config'), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(fetchMatcherPairs).not.toHaveBeenCalled();
    // .env.test pins mainnet, whose config lists 6 curated pairs.
    expect(result.current.pairs.length).toBeGreaterThan(0);
  });
});
