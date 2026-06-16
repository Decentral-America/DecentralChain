/**
 * WsApiContext — unit tests
 *
 * Tests the single-connection multiplexing, subscription routing,
 * ping/pong response, reconnect scheduling, and unsubscribe cleanup.
 *
 * Strategy: mock WebSocket at the global level so we control open/message/close
 * events; use @testing-library/react renderHook to mount the provider.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWsApi, WsApiProvider } from '../WsApiContext';

// ── Mock config ──────────────────────────────────────────────────────────────
vi.mock('@/config', () => ({
  config: { wsUrl: 'wss://test.example.com/ws' },
}));

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

// ── Mock WebSocket ────────────────────────────────────────────────────────────
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  readyState = WebSocket.CONNECTING;
  sentMessages: string[] = [];

  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  }

  simulateOpen() {
    this.readyState = WebSocket.OPEN;
    this.onopen?.();
  }

  simulateMessage(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  simulateClose() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  }
}

function latestWs() {
  return MockWebSocket.instances.at(-1)!;
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <WsApiProvider>{children}</WsApiProvider>;
}

beforeEach(() => {
  MockWebSocket.instances = [];
  vi.stubGlobal('WebSocket', MockWebSocket);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WsApiProvider — connection', () => {
  it('opens a WebSocket to the configured URL', () => {
    renderHook(() => useWsApi(), { wrapper });
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0]?.url).toBe('wss://test.example.com/ws');
  });

  it('isConnected is false before open, true after open', () => {
    const { result } = renderHook(() => useWsApi(), { wrapper });
    expect(result.current.isConnected).toBe(false);

    act(() => {
      latestWs().simulateOpen();
    });
    expect(result.current.isConnected).toBe(true);
  });

  it('isConnected returns false after close', () => {
    const { result } = renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });
    expect(result.current.isConnected).toBe(true);

    act(() => {
      latestWs().simulateClose();
    });
    expect(result.current.isConnected).toBe(false);
  });
});

describe('WsApiProvider — ping/pong', () => {
  it('responds to server ping with pong containing same message_number', () => {
    renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });

    act(() => {
      latestWs().simulateMessage({ message_number: 42, type: 'ping' });
    });

    const ws = latestWs();
    const pong = ws.sentMessages.find((m) => m.includes('"pong"'));
    expect(pong).toBeDefined();
    expect(JSON.parse(pong!)).toEqual({ message_number: 42, type: 'pong' });
  });
});

describe('WsApiProvider — subscribe', () => {
  it('sends subscribe message when subscribing to a topic', () => {
    const { result } = renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });

    act(() => {
      result.current.subscribe('topic://transactions?type=all&address=3Paddr', vi.fn());
    });

    const ws = latestWs();
    const sub = ws.sentMessages.find((m) => m.includes('"subscribe"'));
    expect(sub).toBeDefined();
    expect(JSON.parse(sub!)).toMatchObject({
      topic: 'topic://transactions?type=all&address=3Paddr',
      type: 'subscribe',
    });
  });

  it('routes update messages to the correct handler', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });

    act(() => {
      result.current.subscribe('topic://transactions?type=all&address=3Paddr', handler);
    });

    act(() => {
      latestWs().simulateMessage({
        message_number: 1,
        topic: 'topic://transactions?type=all&address=3Paddr',
        type: 'update',
        value: '{"id":"txid123"}',
      });
    });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(
      'topic://transactions?type=all&address=3Paddr',
      '{"id":"txid123"}',
    );
  });

  it('does NOT route update to handler on a different topic', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });

    act(() => {
      result.current.subscribe('topic://transactions?type=all&address=3Paddr', handler);
    });

    act(() => {
      latestWs().simulateMessage({
        message_number: 1,
        topic: 'topic://state/3Pother/somekey',
        type: 'update',
        value: '{}',
      });
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('delivers subscribed confirmation value to handler', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });

    act(() => {
      result.current.subscribe('topic://state?address__in[]=3P&key__match_any[]=*', handler);
    });

    act(() => {
      latestWs().simulateMessage({
        message_number: 1,
        topic: 'topic://state?address__in[]=3P&key__match_any[]=*',
        type: 'subscribed',
        value: '{"balance":1000}',
      });
    });

    expect(handler).toHaveBeenCalledWith(
      'topic://state?address__in[]=3P&key__match_any[]=*',
      '{"balance":1000}',
    );
  });

  it('multiple handlers on the same topic all receive the update', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const { result } = renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });

    act(() => {
      result.current.subscribe('topic://transactions?type=all&address=3Paddr', h1);
      result.current.subscribe('topic://transactions?type=all&address=3Paddr', h2);
    });

    act(() => {
      latestWs().simulateMessage({
        message_number: 2,
        topic: 'topic://transactions?type=all&address=3Paddr',
        type: 'update',
        value: '{"id":"tx1"}',
      });
    });

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });
});

describe('WsApiProvider — unsubscribe', () => {
  it('unsubscribing removes the handler and sends unsubscribe to server', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });

    let unsub!: () => void;
    act(() => {
      unsub = result.current.subscribe('topic://transactions?type=all&address=3Paddr', handler);
    });

    act(() => {
      unsub();
    });

    // Server receives unsubscribe
    const ws = latestWs();
    const msgs = ws.sentMessages.filter((m) => m.includes('"unsubscribe"'));
    expect(msgs).toHaveLength(1);
    expect(JSON.parse(msgs[0]!)).toMatchObject({ type: 'unsubscribe' });

    // Handler no longer called after unsubscribe
    act(() => {
      ws.simulateMessage({
        message_number: 3,
        topic: 'topic://transactions?type=all&address=3Paddr',
        type: 'update',
        value: '{"id":"tx1"}',
      });
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('keeps topic subscribed on server when one of two handlers unsubscribes', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const { result } = renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });

    let unsub1!: () => void;
    act(() => {
      unsub1 = result.current.subscribe('topic://transactions?type=all&address=3Paddr', h1);
      result.current.subscribe('topic://transactions?type=all&address=3Paddr', h2);
    });

    act(() => {
      unsub1();
    });

    // Only h1 removed — h2 still active — no unsubscribe sent to server
    const ws = latestWs();
    const unsubMsgs = ws.sentMessages.filter((m) => m.includes('"unsubscribe"'));
    expect(unsubMsgs).toHaveLength(0);

    act(() => {
      ws.simulateMessage({
        message_number: 4,
        topic: 'topic://transactions?type=all&address=3Paddr',
        type: 'update',
        value: '{"id":"tx1"}',
      });
    });

    expect(h1).not.toHaveBeenCalled();
    expect(h2).toHaveBeenCalledOnce();
  });
});

describe('WsApiProvider — reconnect', () => {
  it('reconnects after close with exponential backoff', () => {
    renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });
    expect(MockWebSocket.instances).toHaveLength(1);

    act(() => {
      latestWs().simulateClose();
    });

    // Delay doubles before scheduling: 1000 * 2 = 2000ms for the first reconnect.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(MockWebSocket.instances).toHaveLength(2);
  });

  it('re-subscribes all active topics after reconnect', () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });

    act(() => {
      result.current.subscribe('topic://transactions?type=all&address=3Paddr', handler);
    });

    // Force disconnect
    act(() => {
      latestWs().simulateClose();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // New connection opens
    act(() => {
      latestWs().simulateOpen();
    });

    const ws = latestWs();
    const subMsgs = ws.sentMessages.filter((m) => m.includes('"subscribe"'));
    expect(subMsgs.length).toBeGreaterThanOrEqual(1);
    expect(JSON.parse(subMsgs[0]!)).toMatchObject({
      topic: 'topic://transactions?type=all&address=3Paddr',
      type: 'subscribe',
    });
  });
});

describe('WsApiProvider — error handling', () => {
  it('ignores malformed JSON messages without throwing', () => {
    renderHook(() => useWsApi(), { wrapper });
    act(() => {
      latestWs().simulateOpen();
    });

    expect(() => {
      act(() => {
        latestWs().onmessage?.({ data: 'this is not json {{{' });
      });
    }).not.toThrow();
  });
});
