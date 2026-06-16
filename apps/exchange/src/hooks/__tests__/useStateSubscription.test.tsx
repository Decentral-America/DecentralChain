/**
 * useStateSubscription — unit tests
 *
 * Verifies topic construction, delegate to WsApiContext, handler stability,
 * and pausing/resuming via enabled flag.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStateSubscription } from '../useStateSubscription';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSubscribe = vi.fn();
const mockIsConnected = { value: true };

vi.mock('@/contexts/WsApiContext', () => ({
  useWsApi: () => ({
    isConnected: mockIsConnected.value,
    subscribe: mockSubscribe,
  }),
}));

let capturedUnsub = vi.fn();

beforeEach(() => {
  capturedUnsub = vi.fn();
  mockIsConnected.value = true;
  mockSubscribe.mockReturnValue(capturedUnsub);
  vi.clearAllMocks();
  mockSubscribe.mockReturnValue(capturedUnsub);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useStateSubscription — default state topic', () => {
  it('subscribes to the state wildcard topic by default', () => {
    renderHook(() => useStateSubscription('3PtestAddress', vi.fn()));

    expect(mockSubscribe).toHaveBeenCalledWith(
      'topic://state?address__in[]=3PtestAddress&key__match_any[]=*',
      expect.any(Function),
    );
  });

  it('uses the override topic when provided', () => {
    renderHook(() =>
      useStateSubscription(
        '3PtestAddress',
        vi.fn(),
        true,
        'topic://transactions?type=all&address=3PtestAddress',
      ),
    );

    expect(mockSubscribe).toHaveBeenCalledWith(
      'topic://transactions?type=all&address=3PtestAddress',
      expect.any(Function),
    );
  });
});

describe('useStateSubscription — enabled flag', () => {
  it('does not subscribe when enabled is false', () => {
    renderHook(() => useStateSubscription('3PtestAddress', vi.fn(), false));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('does not subscribe when address is null', () => {
    renderHook(() => useStateSubscription(null, vi.fn(), true));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('calls unsub when enabled flips to false', () => {
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useStateSubscription('3PtestAddress', vi.fn(), enabled),
      { initialProps: { enabled: true } },
    );

    expect(mockSubscribe).toHaveBeenCalledOnce();

    rerender({ enabled: false });
    expect(capturedUnsub).toHaveBeenCalled();
  });
});

describe('useStateSubscription — handler stability', () => {
  it('does not re-subscribe when only the handler reference changes', () => {
    const { rerender } = renderHook(
      ({ handler }: { handler: (t: string, v: string) => void }) =>
        useStateSubscription('3PtestAddress', handler, true),
      { initialProps: { handler: vi.fn() } },
    );

    expect(mockSubscribe).toHaveBeenCalledOnce();
    const firstUnsub = capturedUnsub;

    // Pass a brand-new function reference — subscription must NOT re-run.
    rerender({ handler: vi.fn() });

    expect(mockSubscribe).toHaveBeenCalledOnce(); // still only called once
    expect(firstUnsub).not.toHaveBeenCalled(); // old subscription not torn down
  });

  it('always calls the latest handler even after reference changes', () => {
    let latestCall = '';
    const { rerender } = renderHook(
      ({ handler }: { handler: (t: string, v: string) => void }) =>
        useStateSubscription('3PtestAddress', handler, true),
      {
        initialProps: {
          handler: (_t: string, v: string) => {
            latestCall = `first:${v}`;
          },
        },
      },
    );

    // Retrieve the stable handler passed to subscribe
    const stableHandler = mockSubscribe.mock.calls[0]?.[1] as (t: string, v: string) => void;

    // Swap to a new handler
    rerender({
      handler: (_t: string, v: string) => {
        latestCall = `second:${v}`;
      },
    });

    // Invoke the stable handler — it should delegate to the latest handler
    act(() => {
      stableHandler('topic://...', 'payload');
    });

    expect(latestCall).toBe('second:payload');
  });
});

describe('useStateSubscription — isConnected passthrough', () => {
  it('reflects isConnected from WsApiContext', () => {
    mockIsConnected.value = false;
    const { result } = renderHook(() => useStateSubscription('3Paddr', vi.fn()));
    expect(result.current.isConnected).toBe(false);
  });
});
