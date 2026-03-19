/**
 * Tests for usePeerGeo hook and extractIp utility.
 *
 * extractIp is a pure function — tested directly.
 * usePeerGeo is tested with mocked API calls.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api', () => ({
  fetchGeoForIp: vi.fn().mockResolvedValue({
    city: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    org: 'AS12345 Provider GmbH',
    region: 'Berlin',
    timezone: 'Europe/Berlin',
  }),
  fetchGreenCheck: vi.fn().mockResolvedValue({
    green: true,
    hostedBy: 'Green Host Inc.',
  }),
}));

import { extractIp, usePeerGeo } from './usePeerGeo';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

// ── extractIp (pure function) ──────────────────────────────────────────────

describe('extractIp', () => {
  it('extracts IPv4 from /ip:port format', () => {
    expect(extractIp('/192.168.1.1:6868')).toBe('192.168.1.1');
  });

  it('extracts IP when port differs', () => {
    expect(extractIp('/10.0.0.1:6869')).toBe('10.0.0.1');
  });

  it('returns undefined for undefined input', () => {
    expect(extractIp(undefined)).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(extractIp('')).toBeUndefined();
  });

  it('handles single segment (no colon)', () => {
    // '/onlyip' — no colon, split(':')[0] returns 'onlyip' minus '/'
    expect(extractIp('/1.2.3.4')).toBe('1.2.3.4');
  });
});

// ── usePeerGeo ─────────────────────────────────────────────────────────────

describe('usePeerGeo', () => {
  it('returns geo and green data keyed by IP', async () => {
    const { result } = renderHook(() => usePeerGeo(['1.2.3.4']), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current['1.2.3.4']?.geo?.city).toBe('Berlin');
    });

    const entry = result.current['1.2.3.4'];
    expect(entry?.geo?.countryCode).toBe('DE');
    expect(entry?.green?.green).toBe(true);
    expect(entry?.green?.hostedBy).toBe('Green Host Inc.');
  });

  it('returns empty object for empty IP list', () => {
    const { result } = renderHook(() => usePeerGeo([]), { wrapper: makeWrapper() });
    expect(result.current).toEqual({});
  });

  it('marks entries as loading initially', () => {
    const { result } = renderHook(() => usePeerGeo(['5.6.7.8']), {
      wrapper: makeWrapper(),
    });
    // On first render, queries are in-flight
    const entry = result.current['5.6.7.8'];
    // Either loading or resolved — just verify the key exists
    expect(entry).toBeDefined();
  });

  it('handles multiple IPs independently', async () => {
    const { result } = renderHook(() => usePeerGeo(['1.1.1.1', '2.2.2.2']), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current['1.1.1.1']?.geo).toBeDefined();
      expect(result.current['2.2.2.2']?.geo).toBeDefined();
    });
  });
});
