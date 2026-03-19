/**
 * Tests for useNode hooks.
 *
 * Covers: useNodeVersion and useNodeStatus — data shape and fetch behavior.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  fetchNodeStatus: vi.fn().mockResolvedValue({
    blockGeneratorStatus: 'generating',
    historyReplierEnabled: true,
    peersCount: 42,
    stateHash: 'deadbeef',
  }),
  fetchNodeVersion: vi.fn().mockResolvedValue({ version: 'DCC v1.3.5 (DCC)' }),
}));

import { useNodeStatus, useNodeVersion } from './useNode';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe('useNodeVersion', () => {
  it('returns node version string', async () => {
    const { result } = renderHook(() => useNodeVersion(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.version).toBe('DCC v1.3.5 (DCC)');
  });

  it('is initially pending', () => {
    const { result } = renderHook(() => useNodeVersion(), { wrapper: makeWrapper() });
    expect(result.current.isPending).toBe(true);
  });
});

describe('useNodeStatus', () => {
  it('returns node status with blockGeneratorStatus', async () => {
    const { result } = renderHook(() => useNodeStatus(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const data = result.current.data as Record<string, unknown>;
    expect(data?.blockGeneratorStatus).toBe('generating');
    expect(data?.peersCount).toBe(42);
    expect(data?.stateHash).toBe('deadbeef');
  });

  it('is initially pending', () => {
    const { result } = renderHook(() => useNodeStatus(), { wrapper: makeWrapper() });
    expect(result.current.isPending).toBe(true);
  });
});
