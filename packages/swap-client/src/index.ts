import { BigNumber } from '@decentralchain/bignumber';
import Long from 'long';
import { nanoid } from 'nanoid';
import * as protobuf from 'protobufjs/minimal';

import { proto } from './messages.proto.compiled';

protobuf.util.Long = Long;
protobuf.configure();

const DEFAULT_WS_URL = 'wss://swap.decentralchain.io/v2';
const DEFAULT_CONNECT_TIMEOUT_MS = 15_000;
const DEFAULT_DISCONNECT_DELAY_MS = 3_000;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 10;

// Wire-format: 'WAVES' is the native asset ID on the protocol level (same as DecentralCoin/DCC).
// This is an intentional wire-format constraint — see docs/DOCS_CHRONOLOGICAL.md §1.
const NATIVE_ASSET_ID = 'WAVES';

type InvokeArgPrimitive =
  | { type: 'integer'; value: string }
  | { type: 'binary'; value: string }
  | { type: 'string'; value: string }
  | { type: 'boolean'; value: boolean };

type InvokeArg = InvokeArgPrimitive | { type: 'list'; value: InvokeArgPrimitive[] };

export interface SwapClientInvokeTransaction {
  dApp: string;
  call: {
    function: string;
    args: InvokeArg[];
  };
  payment: Array<{ assetId: string | null; amount: string }>;
}

export type SwapClientErrorCode = proto.Response.Error.CODES;
export const SwapClientErrorCode = proto.Response.Error.CODES;

export interface SwapParams {
  address?: string;
  amountCoins: string;
  fromAssetId: string;
  referrer?: string;
  slippageTolerance: number;
  toAssetId: string;
}

export type SwapClientResponse =
  | {
      type: 'error';
      code: SwapClientErrorCode;
    }
  | {
      type: 'data';
      amountCoins: string;
      minimumReceivedCoins: string;
      originalAmountCoins: string;
      originalMinimumReceivedCoins: string;
      priceImpact: number;
      swapParams: SwapParams;
      tx: SwapClientInvokeTransaction;
    };

interface SwapClientRequest {
  id: string;
  swapParams: SwapParams;
}

export interface Subscriber {
  onError: () => void;
  onData: (vendor: string, response: SwapClientResponse) => void;
}

export interface SwapClientOptions {
  connectTimeoutMs?: number;
  maxReconnectAttempts?: number;
  wsUrl?: string;
}

/** Encode a Uint8Array to a base64 string (cross-platform: Node.js + browser). */
function uint8ToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function convertArg(arg: proto.Response.Exchange.Transaction.Argument): InvokeArg {
  switch (arg.value) {
    case 'integerValue':
      if (arg.integerValue == null) {
        throw new Error('Protobuf decode error: integerValue is null');
      }
      return { type: 'integer', value: String(arg.integerValue) };

    case 'binaryValue':
      if (arg.binaryValue == null) {
        throw new Error('Protobuf decode error: binaryValue is null');
      }
      return {
        type: 'binary',
        value: `base64:${uint8ToBase64(arg.binaryValue instanceof Uint8Array ? arg.binaryValue : new Uint8Array(arg.binaryValue))}`,
      };

    case 'stringValue':
      if (arg.stringValue == null) {
        throw new Error('Protobuf decode error: stringValue is null');
      }
      return { type: 'string', value: arg.stringValue };

    case 'booleanValue':
      if (arg.booleanValue == null) {
        throw new Error('Protobuf decode error: booleanValue is null');
      }
      return { type: 'boolean', value: arg.booleanValue };

    case 'list':
      if (arg.list == null) {
        throw new Error('Protobuf decode error: list is null');
      }
      return {
        type: 'list',
        value: (arg.list.items ?? []).map((item) =>
          convertArg(item as proto.Response.Exchange.Transaction.Argument),
        ) as InvokeArgPrimitive[],
      };

    default:
      throw new Error(`Protobuf decode error: unexpected arg.value "${String(arg.value)}"`);
  }
}

export class SwapClient {
  private activeRequest: SwapClientRequest | null = null;
  private connectTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly connectTimeoutMs: number;
  private destroyed = false;
  private disconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastSentRequestId: string | null = null;
  private readonly maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private subscribers: Subscriber[] = [];
  private ws: WebSocket | null = null;
  private readonly wsUrl: string;

  constructor(options?: SwapClientOptions) {
    this.wsUrl = options?.wsUrl ?? DEFAULT_WS_URL;
    this.connectTimeoutMs = options?.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
    this.maxReconnectAttempts = options?.maxReconnectAttempts ?? MAX_RECONNECT_ATTEMPTS;
  }

  get isConnected(): boolean {
    return this.ws != null && this.ws.readyState === WebSocket.OPEN;
  }

  get isDestroyed(): boolean {
    return this.destroyed;
  }

  private connect() {
    if (this.ws || this.destroyed) {
      return;
    }

    const ws = new WebSocket(this.wsUrl);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;

    this.connectTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
      }
    }, this.connectTimeoutMs);

    ws.onopen = () => {
      this.clearConnectTimeout();
      this.reconnectAttempts = 0;
      this.sendRequest();
    };

    ws.onmessage = (event) => {
      try {
        this.handleMessage(event);
      } catch (err) {
        console.error('[SwapClient] Error processing message:', err);
      }
    };

    ws.onclose = () => {
      this.clearConnectTimeout();
      this.cleanupSocket();
      this.lastSentRequestId = null;

      if (this.destroyed || this.subscribers.length === 0) {
        return;
      }

      for (const subscriber of this.subscribers) {
        subscriber.onError();
      }

      this.scheduleReconnect();
    };
  }

  private handleMessage(event: MessageEvent) {
    if (!this.activeRequest) {
      return;
    }

    const decoded = proto.Response.decode(new Uint8Array(event.data as ArrayBuffer));

    if (decoded.id !== this.activeRequest.id || decoded.payload !== 'exchange') {
      return;
    }

    const exchange = decoded.exchange;
    if (exchange == null) {
      console.error('[SwapClient] Malformed response: exchange is null');
      return;
    }

    let response: SwapClientResponse;

    if (exchange.data != null) {
      const data = exchange.data;
      if (data.transaction == null || data.transaction.call == null) {
        console.error('[SwapClient] Malformed exchange data: missing required fields');
        return;
      }

      const { swapParams } = this.activeRequest;

      response = {
        type: 'data',
        amountCoins: new BigNumber(String(data.amount)).toString(),
        minimumReceivedCoins: new BigNumber(String(data.minReceived)).toString(),
        originalAmountCoins: new BigNumber(String(data.originalAmount)).toString(),
        originalMinimumReceivedCoins: new BigNumber(String(data.originalMinReceived)).toString(),
        priceImpact: data.priceImpact ?? 0,
        swapParams,
        tx: {
          dApp: data.transaction.dApp ?? '',
          call: {
            function: data.transaction.call.function ?? '',
            args: (data.transaction.call.arguments ?? []).map((a) =>
              convertArg(a as proto.Response.Exchange.Transaction.Argument),
            ),
          },
          payment: [
            {
              amount: swapParams.amountCoins.toString(),
              assetId: swapParams.fromAssetId === NATIVE_ASSET_ID ? null : swapParams.fromAssetId,
            },
          ],
        },
      };
    } else if (exchange.error != null) {
      const error = exchange.error;
      response = {
        type: 'error',
        code: error.code ?? SwapClientErrorCode.UNEXPECTED,
      };
    } else {
      return;
    }

    const vendor = exchange.vendor ?? '';
    for (const subscriber of this.subscribers) {
      subscriber.onData(vendor, response);
    }
  }

  private scheduleReconnect() {
    if (this.destroyed) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        `[SwapClient] Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`,
      );
      return;
    }

    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * 2 ** this.reconnectAttempts,
      MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private clearConnectTimeout() {
    if (this.connectTimeout != null) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
  }

  private cleanupSocket() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws = null;
    }
  }

  private sendRequest() {
    if (this.ws == null || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!this.activeRequest) {
      return;
    }

    const { id, swapParams } = this.activeRequest;

    if (this.lastSentRequestId === id) {
      return;
    }

    const encoded = proto.Request.encode(
      proto.Request.create({
        exchange: proto.Request.Exchange.create({
          amount: Long.fromString(swapParams.amountCoins),
          id,
          recipient: swapParams.address ?? null,
          referrer: swapParams.referrer ?? null,
          slippageTolerance: Math.round(swapParams.slippageTolerance * 10),
          source: swapParams.fromAssetId,
          target: swapParams.toAssetId,
        }),
      }),
    ).finish();

    this.ws.send(encoded);
    this.lastSentRequestId = id;
  }

  private close() {
    if (this.ws) {
      this.ws.close();
    }

    this.clearConnectTimeout();

    if (this.reconnectTimeout != null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  setSwapParams(swapParams: SwapParams) {
    if (this.destroyed) {
      throw new Error('SwapClient has been destroyed');
    }

    if (!swapParams.fromAssetId || !swapParams.toAssetId) {
      throw new Error('fromAssetId and toAssetId are required');
    }

    if (!swapParams.amountCoins || swapParams.amountCoins === '0') {
      throw new Error('amountCoins must be a positive non-zero value');
    }

    this.activeRequest = { id: nanoid(), swapParams };

    if (this.isConnected) {
      this.sendRequest();
    }
  }

  subscribe(subscriber: Subscriber) {
    if (this.destroyed) {
      throw new Error('SwapClient has been destroyed');
    }

    if (!this.subscribers.includes(subscriber)) {
      this.subscribers.push(subscriber);

      if (this.disconnectTimeout != null) {
        clearTimeout(this.disconnectTimeout);
        this.disconnectTimeout = null;
      }

      if (this.isConnected) {
        this.sendRequest();
      } else {
        this.connect();
      }
    }

    return () => {
      const index = this.subscribers.indexOf(subscriber);

      if (index !== -1) {
        this.subscribers.splice(index, 1);

        if (this.subscribers.length === 0) {
          this.disconnectTimeout = setTimeout(() => {
            this.close();
          }, DEFAULT_DISCONNECT_DELAY_MS);
        }
      }
    };
  }

  destroy() {
    this.destroyed = true;
    this.activeRequest = null;
    this.subscribers = [];

    if (this.disconnectTimeout != null) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }

    this.close();
  }
}
