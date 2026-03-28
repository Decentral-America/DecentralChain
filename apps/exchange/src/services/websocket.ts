/**
 * WebSocket Client Infrastructure
 * Real-time data updates for blockchain and DEX events
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * WebSocket Connection State
 */
export const WebSocketState = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
} as const;
export type WebSocketState = (typeof WebSocketState)[keyof typeof WebSocketState];

/**
 * WebSocket Message Types
 */
export const MessageType = {
  // Blockchain events
  BLOCK: 'block',
  MICROBLOCK: 'microblock',

  // DEX events
  ORDER_BOOK_UPDATE: 'orderbook_update',
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_FILLED: 'order_filled',
  PING: 'ping',
  PONG: 'pong',

  // System events
  SUBSCRIBE: 'subscribe',
  TRADE: 'trade',
  TRANSACTION: 'transaction',
  UNSUBSCRIBE: 'unsubscribe',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

/**
 * WebSocket Message Interface
 */
export interface WebSocketMessage<T = unknown> {
  type: MessageType;
  data: T;
  timestamp?: number;
}

/**
 * Subscription Options
 */
export interface SubscriptionOptions {
  channel: string;
  params?: Record<string, unknown>;
}

/**
 * WebSocket Client Configuration
 */
export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

/**
 * WebSocket Client Class
 * Manages connection, reconnection, and message handling
 */
class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<(data: unknown) => void>> = new Map();
  private stateListeners: Set<(state: WebSocketState) => void> = new Set();
  private currentState: WebSocketState = WebSocketState.DISCONNECTED;

  constructor(config: WebSocketConfig) {
    this.config = {
      debug: config.debug ?? false,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      reconnectInterval: config.reconnectInterval ?? 5000,
      url: config.url,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected');
      return;
    }

    this.setState(WebSocketState.CONNECTING);
    this.log('Connecting to', this.config.url);

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
    } catch (error) {
      this.log('Connection error:', error);
      this.setState(WebSocketState.ERROR);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.log('Disconnecting');
    this.clearTimers();
    this.ws?.close();
    this.ws = null;
    this.setState(WebSocketState.DISCONNECTED);
  }

  /**
   * Send message to server
   */
  send<T>(type: MessageType, data: T): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.log('Cannot send message, not connected');
      return;
    }

    const message: WebSocketMessage<T> = {
      data,
      timestamp: Date.now(),
      type,
    };

    this.ws.send(JSON.stringify(message));
    this.log('Sent message:', message);
  }

  /**
   * Subscribe to a channel
   */
  subscribe(options: SubscriptionOptions): void {
    this.send(MessageType.SUBSCRIBE, options);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string): void {
    this.send(MessageType.UNSUBSCRIBE, { channel });
    this.messageHandlers.delete(channel);
  }

  /**
   * Register message handler for specific channel
   */
  onMessage<T>(channel: string, handler: (data: T) => void): () => void {
    const handlers = this.messageHandlers.get(channel);
    if (!handlers) {
      this.messageHandlers.set(channel, new Set());
    }

    const handlerSet = this.messageHandlers.get(channel) as Set<(data: unknown) => void>;
    handlerSet.add(handler as (data: unknown) => void);

    // Return unsubscribe function
    return () => {
      handlerSet.delete(handler as (data: unknown) => void);
      if (handlerSet.size === 0) {
        this.messageHandlers.delete(channel);
      }
    };
  }

  /**
   * Register state change listener
   */
  onStateChange(listener: (state: WebSocketState) => void): () => void {
    this.stateListeners.add(listener);
    // Immediately notify of current state
    listener(this.currentState);

    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Get current connection state
   */
  getState(): WebSocketState {
    return this.currentState;
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('Connected');
      this.setState(WebSocketState.CONNECTED);
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        this.log('Failed to parse message:', error);
      }
    };

    this.ws.onerror = (error: Event) => {
      this.log('WebSocket error:', error);
      this.setState(WebSocketState.ERROR);
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.log('Connection closed:', event.code, event.reason || '(no reason)');
      this.setState(WebSocketState.DISCONNECTED);
      this.clearTimers();

      // Error 1006: Connection refused/failed - likely server doesn't support WebSocket
      // Stop retrying after 2 attempts to avoid console spam
      if (event.code === 1006 && this.reconnectAttempts >= 2) {
        logger.debug(
          '[WebSocket] Server does not support WebSocket connections. Real-time updates disabled, using HTTP polling instead.',
        );
        return;
      }

      if (!event.wasClean) {
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    this.log('Received message:', message);

    // Handle system messages
    if (message.type === MessageType.PING) {
      this.send(MessageType.PONG, {});
      return;
    }

    // Notify all handlers for this message type
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        handler(message.data);
      });
    }

    // Also notify wildcard handlers
    const wildcardHandlers = this.messageHandlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        handler(message);
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff: delay = baseInterval * 2^attempts
    const delay = this.config.reconnectInterval * 2 ** (this.reconnectAttempts - 1);

    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send(MessageType.PING, {});
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Update connection state and notify listeners
   */
  private setState(state: WebSocketState): void {
    if (this.currentState === state) return;

    this.currentState = state;
    this.stateListeners.forEach((listener) => {
      listener(state);
    });
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      logger.debug('[WebSocket]', ...args);
    }
  }
}

/**
 * React Hook: useWebSocket
 * Manages WebSocket connection with automatic cleanup
 *
 * @param config - WebSocket configuration
 */
export const useWebSocket = (config: WebSocketConfig) => {
  const clientRef = useRef<WebSocketClient | null>(null);
  const configRef = useRef(config);
  const [state, setState] = useState<WebSocketState>(WebSocketState.DISCONNECTED);
  const [isConnected, setIsConnected] = useState(false);

  // Keep configRef current without triggering re-connects
  configRef.current = config;

  // Initialize client — only re-run when the URL changes
  useEffect(() => {
    clientRef.current = new WebSocketClient(configRef.current);
    clientRef.current.connect();

    const unsubscribe = clientRef.current.onStateChange((newState) => {
      setState(newState);
      setIsConnected(newState === WebSocketState.CONNECTED);
    });

    return () => {
      unsubscribe();
      clientRef.current?.disconnect();
    };
  }, []); // Only reconnect when the URL itself changes

  const send = useCallback(<T>(type: MessageType, data: T) => {
    clientRef.current?.send(type, data);
  }, []);

  const subscribe = useCallback((options: SubscriptionOptions) => {
    clientRef.current?.subscribe(options);
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    clientRef.current?.unsubscribe(channel);
  }, []);

  const onMessage = useCallback(<T>(channel: string, handler: (data: T) => void) => {
    return clientRef.current?.onMessage(channel, handler) ?? (() => {});
  }, []);

  return {
    isConnected,
    onMessage,
    send,
    state,
    subscribe,
    unsubscribe,
  };
};

/**
 * React Hook: useWebSocketChannel
 * Subscribe to a specific channel with automatic cleanup
 *
 * @param config - WebSocket configuration
 * @param channel - Channel to subscribe to
 * @param handler - Message handler
 * @param enabled - Whether subscription is enabled
 */
export const useWebSocketChannel = <T>(
  config: WebSocketConfig,
  channel: string,
  handler: (data: T) => void,
  enabled = true,
) => {
  const { subscribe, unsubscribe, onMessage, isConnected } = useWebSocket(config);

  useEffect(() => {
    if (!enabled || !isConnected) return;

    // Subscribe to channel
    subscribe({ channel });

    // Register handler
    const unsubscribeHandler = onMessage<T>(channel, handler);

    // Cleanup
    return () => {
      unsubscribeHandler();
      unsubscribe(channel);
    };
  }, [channel, enabled, isConnected, handler, subscribe, unsubscribe, onMessage]);
};

/**
 * Create WebSocket URL from HTTP URL
 * @param httpUrl - HTTP/HTTPS URL
 */
export const createWebSocketUrl = (httpUrl: string): string => {
  return httpUrl.replace(/^http/, 'ws').replace(/\/$/, '');
};

export { WebSocketClient };
