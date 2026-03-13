import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RequestSchema,
  Response_Error_CODES,
  Response_ErrorSchema,
  Response_Exchange_DataSchema,
  type Response_Exchange_Transaction_Argument,
  Response_Exchange_Transaction_Argument_ListSchema,
  Response_Exchange_Transaction_ArgumentSchema,
  Response_Exchange_Transaction_CallSchema,
  Response_Exchange_TransactionSchema,
  Response_ExchangeSchema,
  ResponseSchema,
} from '../src/gen/messages_pb.js';
import {
  convertArg,
  type Subscriber,
  SwapClient,
  SwapClientErrorCode,
  type SwapClientOptions,
  type SwapClientResponse,
  type SwapParams,
} from '../src/index';

// ---------------------------------------------------------------------------
// WebSocket mock
// ---------------------------------------------------------------------------

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: MockWebSocket[] = [];

  binaryType = 'blob';
  readyState = MockWebSocket.CONNECTING;
  url: string;

  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;

  sentMessages: Uint8Array[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  send(data: Uint8Array) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  /** Simulate the connection opening. */
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  /** Simulate receiving a binary protobuf message. */
  simulateMessage(data: ArrayBuffer) {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  /** Simulate the connection closing. */
  simulateClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

// Expose the OPEN constant on instances (WebSocket.OPEN constant check in source code)
Object.defineProperty(MockWebSocket, 'OPEN', { value: 1 });

function getLastMockWs(): MockWebSocket {
  const ws = MockWebSocket.instances.at(-1);
  if (!ws) throw new Error('No MockWebSocket instances');
  return ws;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function validSwapParams(overrides?: Partial<SwapParams>): SwapParams {
  return {
    amountCoins: '100000000',
    fromAssetId: 'WAVES',
    toAssetId: 'DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p',
    slippageTolerance: 1,
    ...overrides,
  };
}

/** Encode a Response into an ArrayBuffer for simulation. */
function encodeResponse(fields: {
  id: string;
  vendor?: string;
  data?: {
    amount: number;
    minReceived: number;
    originalAmount: number;
    originalMinReceived: number;
    priceImpact?: number;
    dApp: string;
    fn: string;
    args?: Response_Exchange_Transaction_Argument[];
  };
  error?: { code: Response_Error_CODES; message?: string };
}): ArrayBuffer {
  const exchange = create(Response_ExchangeSchema);
  exchange.vendor = fields.vendor ?? 'test-vendor';

  if (fields.data) {
    const tx = create(Response_Exchange_TransactionSchema);
    tx.dApp = fields.data.dApp;
    tx.call = create(Response_Exchange_Transaction_CallSchema);
    tx.call.function = fields.data.fn;
    tx.call.arguments = fields.data.args ?? [];

    const data = create(Response_Exchange_DataSchema);
    data.amount = BigInt(fields.data.amount);
    data.minReceived = BigInt(fields.data.minReceived);
    data.originalAmount = BigInt(fields.data.originalAmount);
    data.originalMinReceived = BigInt(fields.data.originalMinReceived);
    data.priceImpact = fields.data.priceImpact ?? 0.01;
    data.transaction = tx;

    exchange.result = { case: 'data', value: data };
  }

  if (fields.error) {
    const error = create(Response_ErrorSchema);
    error.code = fields.error.code;
    error.message = fields.error.message ?? '';
    exchange.result = { case: 'error', value: error };
  }

  const msg = create(ResponseSchema);
  msg.id = fields.id;
  msg.payload = { case: 'exchange', value: exchange };

  const bytes = toBinary(ResponseSchema, msg);
  return bytes.buffer as ArrayBuffer;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  MockWebSocket.instances = [];
  vi.stubGlobal('WebSocket', MockWebSocket);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ── Exports ──────────────────────────────────────────────────────

describe('exports', () => {
  it('exports SwapClient class', () => {
    expect(SwapClient).toBeDefined();
    expect(typeof SwapClient).toBe('function');
  });

  it('exports SwapClientErrorCode enum', () => {
    expect(SwapClientErrorCode).toBeDefined();
    expect(SwapClientErrorCode.UNAVAILABLE).toBe(0);
    expect(SwapClientErrorCode.UNEXPECTED).toBe(1);
    expect(SwapClientErrorCode.INVALID_ASSET_PAIR).toBe(2);
    expect(SwapClientErrorCode.INVALID_ARGUMENTS).toBe(3);
  });

  it('exports convertArg function', () => {
    expect(convertArg).toBeDefined();
    expect(typeof convertArg).toBe('function');
  });
});

// ── Constructor ──────────────────────────────────────────────────

describe('SwapClient constructor', () => {
  it('creates instance with default options', () => {
    const client = new SwapClient();
    expect(client).toBeInstanceOf(SwapClient);
    expect(client.isConnected).toBe(false);
    expect(client.isDestroyed).toBe(false);
  });

  it('creates instance with custom wsUrl', () => {
    const client = new SwapClient({ wsUrl: 'wss://custom.example.com/v2' });
    expect(client).toBeInstanceOf(SwapClient);
  });

  it('creates instance with custom timeouts', () => {
    const client = new SwapClient({
      connectTimeoutMs: 5_000,
      maxReconnectAttempts: 3,
    });
    expect(client).toBeInstanceOf(SwapClient);
  });
});

// ── Input validation ─────────────────────────────────────────────

describe('setSwapParams validation', () => {
  it('rejects empty fromAssetId', () => {
    const client = new SwapClient();
    expect(() => client.setSwapParams(validSwapParams({ fromAssetId: '' }))).toThrow(
      'fromAssetId and toAssetId are required',
    );
  });

  it('rejects empty toAssetId', () => {
    const client = new SwapClient();
    expect(() => client.setSwapParams(validSwapParams({ toAssetId: '' }))).toThrow(
      'fromAssetId and toAssetId are required',
    );
  });

  it('rejects zero amountCoins', () => {
    const client = new SwapClient();
    expect(() => client.setSwapParams(validSwapParams({ amountCoins: '0' }))).toThrow(
      'amountCoins must be a positive non-zero value',
    );
  });

  it('rejects empty amountCoins', () => {
    const client = new SwapClient();
    expect(() => client.setSwapParams(validSwapParams({ amountCoins: '' }))).toThrow(
      'amountCoins must be a positive non-zero value',
    );
  });

  it('accepts valid params', () => {
    const client = new SwapClient();
    expect(() => client.setSwapParams(validSwapParams())).not.toThrow();
  });

  it('throws if client is destroyed', () => {
    const client = new SwapClient();
    client.destroy();
    expect(() => client.setSwapParams(validSwapParams())).toThrow('SwapClient has been destroyed');
  });
});

// ── Subscribe / Unsubscribe ──────────────────────────────────────

describe('subscribe', () => {
  it('returns an unsubscribe function', () => {
    const client = new SwapClient();
    const subscriber: Subscriber = { onError: vi.fn(), onData: vi.fn() };
    const unsub = client.subscribe(subscriber);
    expect(typeof unsub).toBe('function');
    client.destroy();
  });

  it('connects WebSocket on first subscribe', () => {
    const client = new SwapClient();
    const subscriber: Subscriber = { onError: vi.fn(), onData: vi.fn() };
    client.subscribe(subscriber);
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(getLastMockWs().url).toBe('wss://swap.decentralchain.io/v2');
    client.destroy();
  });

  it('does not duplicate subscriber', () => {
    const client = new SwapClient();
    const subscriber: Subscriber = { onError: vi.fn(), onData: vi.fn() };
    client.subscribe(subscriber);
    client.subscribe(subscriber);
    // Only 1 WebSocket should be created
    expect(MockWebSocket.instances).toHaveLength(1);
    client.destroy();
  });

  it('throws if client is destroyed', () => {
    const client = new SwapClient();
    client.destroy();
    expect(() => client.subscribe({ onError: vi.fn(), onData: vi.fn() })).toThrow(
      'SwapClient has been destroyed',
    );
  });

  it('disconnects after last unsubscribe with delay', () => {
    const client = new SwapClient();
    const subscriber: Subscriber = { onError: vi.fn(), onData: vi.fn() };
    const unsub = client.subscribe(subscriber);
    const ws = getLastMockWs();
    ws.simulateOpen();

    unsub();

    // WebSocket should still be open (disconnect delay)
    expect(ws.readyState).toBe(MockWebSocket.OPEN);

    // After 3s disconnect delay, close is called
    vi.advanceTimersByTime(3_000);
    expect(ws.readyState).toBe(MockWebSocket.CLOSED);
  });
});

// ── Connection lifecycle ─────────────────────────────────────────

describe('connection lifecycle', () => {
  it('sends request after WebSocket opens', () => {
    const client = new SwapClient();
    client.subscribe({ onError: vi.fn(), onData: vi.fn() });
    client.setSwapParams(validSwapParams());

    const ws = getLastMockWs();
    ws.simulateOpen();

    expect(ws.sentMessages).toHaveLength(1);
    client.destroy();
  });

  it('does not send duplicate request for same params', () => {
    const client = new SwapClient();
    client.subscribe({ onError: vi.fn(), onData: vi.fn() });
    client.setSwapParams(validSwapParams());

    const ws = getLastMockWs();
    ws.simulateOpen();

    // Try subscribing again — same request should not be re-sent
    const sub2: Subscriber = { onError: vi.fn(), onData: vi.fn() };
    client.subscribe(sub2);

    expect(ws.sentMessages).toHaveLength(1);
    client.destroy();
  });

  it('sends new request when params change', () => {
    const client = new SwapClient();
    client.subscribe({ onError: vi.fn(), onData: vi.fn() });
    client.setSwapParams(validSwapParams());

    const ws = getLastMockWs();
    ws.simulateOpen();

    client.setSwapParams(validSwapParams({ amountCoins: '200000000' }));
    expect(ws.sentMessages).toHaveLength(2);
    client.destroy();
  });

  it('times out connection after connectTimeoutMs', () => {
    const client = new SwapClient({ connectTimeoutMs: 5_000 });
    client.subscribe({ onError: vi.fn(), onData: vi.fn() });

    const ws = getLastMockWs();
    // WebSocket stays in CONNECTING — never opens
    expect(ws.readyState).toBe(MockWebSocket.CONNECTING);

    vi.advanceTimersByTime(5_000);

    // Should have been closed by timeout
    expect(ws.readyState).toBe(MockWebSocket.CLOSED);
    client.destroy();
  });
});

// ── Reconnection ─────────────────────────────────────────────────

describe('reconnection', () => {
  it('reconnects with exponential backoff on close', () => {
    const client = new SwapClient({ maxReconnectAttempts: 3 });
    const onError = vi.fn();
    client.subscribe({ onError, onData: vi.fn() });
    client.setSwapParams(validSwapParams());

    const ws1 = getLastMockWs();
    ws1.simulateOpen();
    ws1.simulateClose();

    expect(onError).toHaveBeenCalledTimes(1);

    // First reconnect: 1s delay
    vi.advanceTimersByTime(1_000);
    expect(MockWebSocket.instances).toHaveLength(2);

    // Second close + reconnect: 2s delay
    const ws2 = getLastMockWs();
    ws2.simulateClose();
    expect(onError).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(2_000);
    expect(MockWebSocket.instances).toHaveLength(3);

    // Third close + reconnect: 4s delay
    const ws3 = getLastMockWs();
    ws3.simulateClose();
    expect(onError).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(4_000);
    expect(MockWebSocket.instances).toHaveLength(4);

    // Fourth close — max attempts reached, no more reconnections
    const ws4 = getLastMockWs();
    ws4.simulateClose();
    expect(onError).toHaveBeenCalledTimes(4);
    vi.advanceTimersByTime(10_000);
    expect(MockWebSocket.instances).toHaveLength(4);
    client.destroy();
  });

  it('resets reconnect counter on successful connection', () => {
    const client = new SwapClient({ maxReconnectAttempts: 5 });
    client.subscribe({ onError: vi.fn(), onData: vi.fn() });
    client.setSwapParams(validSwapParams());

    const ws1 = getLastMockWs();
    ws1.simulateOpen();
    ws1.simulateClose();

    // Reconnect after 1s
    vi.advanceTimersByTime(1_000);
    const ws2 = getLastMockWs();
    ws2.simulateOpen(); // Successful connection resets attempts

    ws2.simulateClose();
    // Should use 1s delay again (reset), not 2s
    vi.advanceTimersByTime(1_000);
    expect(MockWebSocket.instances).toHaveLength(3);
    client.destroy();
  });

  it('does not reconnect when destroyed', () => {
    const client = new SwapClient();
    client.subscribe({ onError: vi.fn(), onData: vi.fn() });

    const ws = getLastMockWs();
    ws.simulateOpen();

    client.destroy();

    // Even after waiting, no reconnect
    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('does not reconnect when no subscribers', () => {
    const client = new SwapClient();
    const unsub = client.subscribe({ onError: vi.fn(), onData: vi.fn() });

    const ws = getLastMockWs();
    ws.simulateOpen();

    unsub();
    // Wait for disconnect delay
    vi.advanceTimersByTime(3_000);

    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances).toHaveLength(1);
    client.destroy();
  });
});

// ── Message handling ─────────────────────────────────────────────

describe('message handling', () => {
  function setupConnectedClient() {
    const onData = vi.fn();
    const onError = vi.fn();
    const client = new SwapClient();
    const params = validSwapParams();

    client.subscribe({ onError, onData });
    client.setSwapParams(params);

    const ws = getLastMockWs();
    ws.simulateOpen();

    // Decode the sent message to get the request ID
    const sentBytes = ws.sentMessages[0];
    if (!sentBytes) throw new Error('No message sent');
    const decoded = fromBinary(RequestSchema, sentBytes);
    const requestId = decoded.payload.case === 'exchange' ? decoded.payload.value.id : '';

    return { client, ws, onData, onError, requestId, params };
  }

  it('delivers data response to subscribers', () => {
    const { client, ws, onData, requestId } = setupConnectedClient();

    const buf = encodeResponse({
      id: requestId,
      vendor: 'puzzle-swap',
      data: {
        amount: 100000000,
        minReceived: 99000000,
        originalAmount: 100000000,
        originalMinReceived: 99000000,
        priceImpact: 0.005,
        dApp: '3P8d1E1BLKoD52y3bQJ1bDTd2TD1gpaLn9t',
        fn: 'swap',
      },
    });

    ws.simulateMessage(buf);

    expect(onData).toHaveBeenCalledTimes(1);
    const [vendor, response] = onData.mock.calls[0] as [string, SwapClientResponse];
    expect(vendor).toBe('puzzle-swap');
    expect(response.type).toBe('data');

    if (response.type === 'data') {
      expect(response.amountCoins).toBe('100000000');
      expect(response.minimumReceivedCoins).toBe('99000000');
      expect(response.priceImpact).toBe(0.005);
      expect(response.tx.dApp).toBe('3P8d1E1BLKoD52y3bQJ1bDTd2TD1gpaLn9t');
      expect(response.tx.call.function).toBe('swap');
      expect(response.tx.payment[0]?.assetId).toBeNull(); // WAVES → null
      expect(response.tx.payment[0]?.amount).toBe('100000000');
    }

    client.destroy();
  });

  it('delivers error response to subscribers', () => {
    const { client, ws, onData, requestId } = setupConnectedClient();

    const buf = encodeResponse({
      id: requestId,
      error: { code: Response_Error_CODES.INVALID_ASSET_PAIR },
    });

    ws.simulateMessage(buf);

    expect(onData).toHaveBeenCalledTimes(1);
    const [_vendor, response] = onData.mock.calls[0] as [string, SwapClientResponse];
    expect(response.type).toBe('error');

    if (response.type === 'error') {
      expect(response.code).toBe(SwapClientErrorCode.INVALID_ASSET_PAIR);
    }

    client.destroy();
  });

  it('ignores messages with wrong request ID', () => {
    const { client, ws, onData } = setupConnectedClient();

    const buf = encodeResponse({
      id: 'wrong-id',
      data: {
        amount: 1,
        minReceived: 1,
        originalAmount: 1,
        originalMinReceived: 1,
        dApp: 'x',
        fn: 'y',
      },
    });

    ws.simulateMessage(buf);
    expect(onData).not.toHaveBeenCalled();
    client.destroy();
  });

  it('handles malformed exchange data gracefully', () => {
    const { client, ws, onData, requestId } = setupConnectedClient();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Encode a response with exchange but no data/error result (malformed)
    const exchange = create(Response_ExchangeSchema);
    exchange.vendor = 'test';
    const msg = create(ResponseSchema);
    msg.id = requestId;
    msg.payload = { case: 'exchange', value: exchange };
    const encoded = toBinary(ResponseSchema, msg);
    const buf = encoded.buffer as ArrayBuffer;

    ws.simulateMessage(buf);

    // Should not crash, should not deliver
    expect(onData).not.toHaveBeenCalled();
    client.destroy();
    consoleSpy.mockRestore();
  });

  it('delivers to multiple subscribers', () => {
    const onData1 = vi.fn();
    const onData2 = vi.fn();
    const client = new SwapClient();

    client.subscribe({ onError: vi.fn(), onData: onData1 });
    client.subscribe({ onError: vi.fn(), onData: onData2 });
    client.setSwapParams(validSwapParams());

    const ws = getLastMockWs();
    ws.simulateOpen();

    const sentMsg = ws.sentMessages[0];
    if (!sentMsg) throw new Error('No message sent');
    const decoded = fromBinary(RequestSchema, sentMsg);
    const requestId = decoded.payload.case === 'exchange' ? decoded.payload.value.id : '';

    const buf = encodeResponse({
      id: requestId,
      data: {
        amount: 100,
        minReceived: 99,
        originalAmount: 100,
        originalMinReceived: 99,
        dApp: 'test',
        fn: 'swap',
      },
    });

    ws.simulateMessage(buf);

    expect(onData1).toHaveBeenCalledTimes(1);
    expect(onData2).toHaveBeenCalledTimes(1);
    client.destroy();
  });

  it('handles non-WAVES fromAssetId correctly', () => {
    const onData = vi.fn();
    const client = new SwapClient();
    const customAssetId = 'DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p';

    client.subscribe({ onError: vi.fn(), onData });
    client.setSwapParams(
      validSwapParams({
        fromAssetId: customAssetId,
        toAssetId: 'WAVES',
      }),
    );

    const ws = getLastMockWs();
    ws.simulateOpen();

    const firstMsg = ws.sentMessages[0];
    if (!firstMsg) throw new Error('No message sent');
    const decoded = fromBinary(RequestSchema, firstMsg);
    const requestId = decoded.payload.case === 'exchange' ? decoded.payload.value.id : '';

    const buf = encodeResponse({
      id: requestId,
      data: {
        amount: 100,
        minReceived: 99,
        originalAmount: 100,
        originalMinReceived: 99,
        dApp: 'test',
        fn: 'swap',
      },
    });

    ws.simulateMessage(buf);

    const [, response] = onData.mock.calls[0] as [string, SwapClientResponse];
    if (response.type === 'data') {
      expect(response.tx.payment[0]?.assetId).toBe(customAssetId);
    }

    client.destroy();
  });
});

// ── convertArg ───────────────────────────────────────────────────

describe('convertArg', () => {
  it('converts integer value', () => {
    const arg = create(Response_Exchange_Transaction_ArgumentSchema, {
      value: { case: 'integerValue', value: 42n },
    });
    const result = convertArg(arg);
    expect(result).toEqual({ type: 'integer', value: '42' });
  });

  it('converts string value', () => {
    const arg = create(Response_Exchange_Transaction_ArgumentSchema, {
      value: { case: 'stringValue', value: 'hello' },
    });
    const result = convertArg(arg);
    expect(result).toEqual({ type: 'string', value: 'hello' });
  });

  it('converts boolean value', () => {
    const arg = create(Response_Exchange_Transaction_ArgumentSchema, {
      value: { case: 'booleanValue', value: true },
    });
    const result = convertArg(arg);
    expect(result).toEqual({ type: 'boolean', value: true });
  });

  it('converts binary value with base64 prefix', () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
    const arg = create(Response_Exchange_Transaction_ArgumentSchema, {
      value: { case: 'binaryValue', value: bytes },
    });
    const result = convertArg(arg);
    expect(result.type).toBe('binary');
    if (result.type === 'binary') {
      expect(result.value).toMatch(/^base64:/);
      // Verify the base64 decodes to the original bytes
      const decoded = Buffer.from(result.value.slice(7), 'base64');
      expect(new Uint8Array(decoded)).toEqual(bytes);
    }
  });

  it('converts list value', () => {
    const arg = create(Response_Exchange_Transaction_ArgumentSchema, {
      value: {
        case: 'list',
        value: create(Response_Exchange_Transaction_Argument_ListSchema, {
          items: [
            create(Response_Exchange_Transaction_ArgumentSchema, {
              value: { case: 'stringValue', value: 'a' },
            }),
            create(Response_Exchange_Transaction_ArgumentSchema, {
              value: { case: 'integerValue', value: 1n },
            }),
          ],
        }),
      },
    });
    const result = convertArg(arg);
    expect(result.type).toBe('list');
    if (result.type === 'list') {
      expect(result.value).toHaveLength(2);
      expect(result.value[0]).toEqual({ type: 'string', value: 'a' });
      expect(result.value[1]).toEqual({ type: 'integer', value: '1' });
    }
  });

  it('throws on unset arg value', () => {
    const arg = create(Response_Exchange_Transaction_ArgumentSchema);
    expect(() => convertArg(arg)).toThrow('unexpected arg.value');
  });

  it('throws on unexpected arg type', () => {
    const arg = { value: { case: 'unknown' } } as unknown as Response_Exchange_Transaction_Argument;
    expect(() => convertArg(arg)).toThrow('unexpected arg.value');
  });
});

// ── destroy ──────────────────────────────────────────────────────

describe('destroy', () => {
  it('sets isDestroyed to true', () => {
    const client = new SwapClient();
    expect(client.isDestroyed).toBe(false);
    client.destroy();
    expect(client.isDestroyed).toBe(true);
  });

  it('closes active WebSocket', () => {
    const client = new SwapClient();
    client.subscribe({ onError: vi.fn(), onData: vi.fn() });
    const ws = getLastMockWs();
    ws.simulateOpen();

    client.destroy();
    expect(ws.readyState).toBe(MockWebSocket.CLOSED);
  });

  it('clears all timers', () => {
    const client = new SwapClient();
    client.subscribe({ onError: vi.fn(), onData: vi.fn() });

    client.destroy();

    // Advancing timers should have no effect
    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('is idempotent', () => {
    const client = new SwapClient();
    expect(() => {
      client.destroy();
      client.destroy();
    }).not.toThrow();
  });
});

// ── Protocol encoding ────────────────────────────────────────────

describe('protocol encoding', () => {
  it('encodes swap request correctly', () => {
    const client = new SwapClient();
    const params = validSwapParams({
      address: '3P8d1E1BLKoD52y3bQJ1bDTd2TD1gpaLn9t',
      referrer: '3PLrCnhKyX5iFbGDxbqqMvea5fBQXHEhLiN',
    });

    client.subscribe({ onError: vi.fn(), onData: vi.fn() });
    client.setSwapParams(params);

    const ws = getLastMockWs();
    ws.simulateOpen();

    expect(ws.sentMessages).toHaveLength(1);

    const firstMsg = ws.sentMessages[0];
    if (!firstMsg) throw new Error('No message sent');
    const decoded = fromBinary(RequestSchema, firstMsg);
    expect(decoded.payload.case).toBe('exchange');
    if (decoded.payload.case !== 'exchange') throw new Error('Expected exchange payload');
    expect(decoded.payload.value.source).toBe(params.fromAssetId);
    expect(decoded.payload.value.target).toBe(params.toAssetId);
    expect(decoded.payload.value.amount.toString()).toBe(params.amountCoins);
    expect(decoded.payload.value.recipient).toBe(params.address);
    expect(decoded.payload.value.referrer).toBe(params.referrer);
    expect(decoded.payload.value.slippageTolerance).toBe(Math.round(params.slippageTolerance * 10));

    client.destroy();
  });
});

// ── SwapClientResponse type shapes ───────────────────────────────

describe('type shapes', () => {
  it('error response shape', () => {
    const response: SwapClientResponse = {
      type: 'error',
      code: SwapClientErrorCode.UNAVAILABLE,
    };
    expect(response.type).toBe('error');
  });

  it('data response shape', () => {
    const response: SwapClientResponse = {
      type: 'data',
      amountCoins: '1000000',
      minimumReceivedCoins: '990000',
      originalAmountCoins: '1000000',
      originalMinimumReceivedCoins: '990000',
      priceImpact: 0.01,
      swapParams: validSwapParams(),
      tx: {
        dApp: '3P8d1E1BLKoD52y3bQJ1bDTd2TD1gpaLn9t',
        call: {
          function: 'swap',
          args: [
            { type: 'string', value: 'DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p' },
            { type: 'integer', value: '990000' },
          ],
        },
        payment: [{ assetId: null, amount: '1000000' }],
      },
    };
    expect(response.type).toBe('data');
  });

  it('SwapClientOptions type', () => {
    const opts: SwapClientOptions = { wsUrl: 'wss://example.com', connectTimeoutMs: 5000 };
    expect(opts.wsUrl).toBe('wss://example.com');
  });
});
