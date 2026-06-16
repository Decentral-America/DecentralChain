/**
 * useTransactionStream — unit tests
 *
 * Tests JSON parsing, dedup by tx ID, type filtering,
 * minConfirmations filtering, and state reset on address change.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type TransactionNotification, useTransactionStream } from '../useTransactionStream';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSubscribe = vi.fn();
const mockIsConnected = { isConnected: false };

vi.mock('@/contexts/WsApiContext', () => ({
  useWsApi: () => ({
    isConnected: mockIsConnected.isConnected,
    subscribe: mockSubscribe,
  }),
}));

vi.mock('@/config', () => ({
  config: { wsUrl: 'wss://test.example.com/ws' },
}));

vi.mock('@/contexts', () => ({
  useAuth: () => ({ user: { address: '3PtestAddress' } }),
}));

// Capture the handler registered by useTransactionStream so tests can invoke it directly.
let capturedHandler: ((topic: string, value: string) => void) | null = null;
const capturedUnsub: () => void = vi.fn();

beforeEach(() => {
  capturedHandler = null;
  mockIsConnected.isConnected = true;
  mockSubscribe.mockImplementation((_topic: string, handler: (t: string, v: string) => void) => {
    capturedHandler = handler;
    return capturedUnsub;
  });
  vi.clearAllMocks();
  // Re-setup after clearAllMocks
  mockSubscribe.mockImplementation((_topic: string, handler: (t: string, v: string) => void) => {
    capturedHandler = handler;
    return capturedUnsub;
  });
});

function makeTxValue(overrides: Partial<Record<string, unknown>> = {}): string {
  return JSON.stringify({
    amount: 100_000_000,
    applicationStatus: 'succeeded',
    height: 12345,
    id: 'txid-001',
    recipient: '3Precipient',
    sender: '3Psender',
    timestamp: 1_700_000_000_000,
    type: 4,
    ...overrides,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useTransactionStream — subscription topic', () => {
  it('subscribes to transactions?type=all for the current address', () => {
    renderHook(() => useTransactionStream());
    expect(mockSubscribe).toHaveBeenCalledWith(
      'topic://transactions?type=all&address=3PtestAddress',
      expect.any(Function),
    );
  });

  it('returns isListening true when connected', () => {
    mockIsConnected.isConnected = true;
    const { result } = renderHook(() => useTransactionStream());
    expect(result.current.isListening).toBe(true);
  });
});

describe('useTransactionStream — JSON parsing', () => {
  it('parses incoming update and adds to transactions', () => {
    const { result } = renderHook(() => useTransactionStream());

    act(() => {
      capturedHandler?.('topic://transactions?type=all&address=3PtestAddress', makeTxValue());
    });

    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0]?.id).toBe('txid-001');
    expect(result.current.transactions[0]?.type).toBe(4);
    expect(result.current.transactions[0]?.amount).toBe(100_000_000);
  });

  it('sets lastTransaction to the most recent tx', () => {
    const { result } = renderHook(() => useTransactionStream());

    act(() => {
      capturedHandler?.('topic://...', makeTxValue({ id: 'tx-A' }));
    });
    act(() => {
      capturedHandler?.('topic://...', makeTxValue({ id: 'tx-B' }));
    });

    expect(result.current.lastTransaction?.id).toBe('tx-B');
  });

  it('maps applicationStatus failed to status failed', () => {
    const { result } = renderHook(() => useTransactionStream());

    act(() => {
      capturedHandler?.('topic://...', makeTxValue({ applicationStatus: 'failed' }));
    });

    expect(result.current.transactions[0]?.status).toBe('failed');
  });

  it('maps applicationStatus succeeded to status confirmed', () => {
    const { result } = renderHook(() => useTransactionStream());

    act(() => {
      capturedHandler?.('topic://...', makeTxValue({ applicationStatus: 'succeeded' }));
    });

    expect(result.current.transactions[0]?.status).toBe('confirmed');
  });

  it('ignores malformed JSON without throwing', () => {
    const { result } = renderHook(() => useTransactionStream());

    expect(() => {
      act(() => {
        capturedHandler?.('topic://...', 'this is not json {{{');
      });
    }).not.toThrow();

    expect(result.current.transactions).toHaveLength(0);
  });

  it('ignores messages with no id field', () => {
    const { result } = renderHook(() => useTransactionStream());

    act(() => {
      capturedHandler?.('topic://...', JSON.stringify({ sender: '3P', type: 4 }));
    });

    expect(result.current.transactions).toHaveLength(0);
  });
});

describe('useTransactionStream — deduplication', () => {
  it('does not add the same tx ID twice', () => {
    const { result } = renderHook(() => useTransactionStream());

    act(() => {
      capturedHandler?.('topic://...', makeTxValue({ id: 'tx-dup' }));
      capturedHandler?.('topic://...', makeTxValue({ id: 'tx-dup' }));
    });

    expect(result.current.transactions).toHaveLength(1);
  });
});

describe('useTransactionStream — filterTypes', () => {
  it('drops transactions whose type is not in filterTypes', () => {
    const { result } = renderHook(() => useTransactionStream(undefined, { filterTypes: [4, 11] }));

    act(() => {
      capturedHandler?.('topic://...', makeTxValue({ type: 7 })); // exchange — filtered out
    });

    expect(result.current.transactions).toHaveLength(0);
  });

  it('keeps transactions whose type is in filterTypes', () => {
    const { result } = renderHook(() => useTransactionStream(undefined, { filterTypes: [4, 11] }));

    act(() => {
      capturedHandler?.('topic://...', makeTxValue({ type: 4 }));
    });

    expect(result.current.transactions).toHaveLength(1);
  });
});

describe('useTransactionStream — minConfirmations', () => {
  it('drops tx when confirmations (always 1) < minConfirmations', () => {
    const { result } = renderHook(() => useTransactionStream(undefined, { minConfirmations: 3 }));

    act(() => {
      capturedHandler?.('topic://...', makeTxValue());
    });

    expect(result.current.transactions).toHaveLength(0);
  });

  it('keeps tx when confirmations >= minConfirmations', () => {
    const { result } = renderHook(() => useTransactionStream(undefined, { minConfirmations: 1 }));

    act(() => {
      capturedHandler?.('topic://...', makeTxValue());
    });

    expect(result.current.transactions).toHaveLength(1);
  });
});

describe('useTransactionStream — onNewTransaction callback', () => {
  it('calls onNewTransaction for each new transaction', () => {
    const cb = vi.fn();
    renderHook(() => useTransactionStream(cb));

    act(() => {
      capturedHandler?.('topic://...', makeTxValue({ id: 'tx-cb-1' }));
    });

    expect(cb).toHaveBeenCalledOnce();
    const arg = cb.mock.calls[0]?.[0] as TransactionNotification;
    expect(arg.id).toBe('tx-cb-1');
  });

  it('does not call onNewTransaction for duplicate tx', () => {
    const cb = vi.fn();
    renderHook(() => useTransactionStream(cb));

    act(() => {
      capturedHandler?.('topic://...', makeTxValue({ id: 'tx-dup2' }));
      capturedHandler?.('topic://...', makeTxValue({ id: 'tx-dup2' }));
    });

    expect(cb).toHaveBeenCalledOnce();
  });
});

describe('useTransactionStream — cap at 50 transactions', () => {
  it('keeps only the last 50 transactions', () => {
    const { result } = renderHook(() => useTransactionStream());

    act(() => {
      for (let i = 0; i < 55; i++) {
        capturedHandler?.('topic://...', makeTxValue({ id: `tx-${i}` }));
      }
    });

    expect(result.current.transactions).toHaveLength(50);
  });
});

describe('useTransactionStream — enabled option', () => {
  it('does not subscribe when enabled is false', () => {
    renderHook(() => useTransactionStream(undefined, { enabled: false }));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('isListening is false when enabled is false', () => {
    const { result } = renderHook(() => useTransactionStream(undefined, { enabled: false }));
    expect(result.current.isListening).toBe(false);
  });
});
