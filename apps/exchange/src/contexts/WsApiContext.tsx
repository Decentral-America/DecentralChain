/**
 * Shared WebSocket connection to the DCC ws-api.
 *
 * A single persistent WebSocket is multiplexed across all topic subscriptions
 * in the app. Callers subscribe via `useWsApi().subscribe(topic, handler)`.
 *
 * Protocol:
 *   subscribe   → {"type":"subscribe","topic":"topic://..."}
 *   update      → {"type":"update","topic":"...","value":"...","message_number":N}
 *   subscribed  → {"type":"subscribed","topic":"...","value":"...","message_number":N}
 *   ping        → {"type":"ping","message_number":N}
 *   pong        ← {"type":"pong","message_number":N}
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { config } from '@/config';
import { logger } from '@/lib/logger';

type Handler = (topic: string, value: string) => void;

interface WsApiContextValue {
  isConnected: boolean;
  subscribe: (topic: string, handler: Handler) => () => void;
}

interface WsMessage {
  type: 'subscribed' | 'update' | 'unsubscribed' | 'ping' | 'pong' | 'error';
  topic?: string;
  value?: string;
  message_number?: number;
  code?: number;
  message?: string;
}

const WsApiContext = createContext<WsApiContextValue>({
  isConnected: false,
  subscribe: () => () => undefined,
});

export function WsApiProvider({ children }: { children: React.ReactNode }) {
  const wsUrl = config.wsUrl;
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const reconnectDelayRef = useRef(1000);

  // Map of topic → Set of handlers. Multiple callers can subscribe to the same topic.
  const handlersRef = useRef<Map<string, Set<Handler>>>(new Map());
  // Topics currently acknowledged by the server (subscribed confirmation received).
  const activeTopicsRef = useRef<Set<string>>(new Set());

  const sendSubscribe = useCallback((ws: WebSocket, topic: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ topic, type: 'subscribe' }));
    }
  }, []);

  const dispatch = useCallback((topic: string, value: string) => {
    const handlers = handlersRef.current.get(topic);
    if (handlers) for (const h of handlers) h(topic, value);
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || !wsUrl) return;

    logger.debug('[WsApi] Connecting to', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      logger.debug('[WsApi] Connected');
      setIsConnected(true);
      reconnectDelayRef.current = 1000;
      activeTopicsRef.current.clear();

      // Re-subscribe to all topics that have active handlers.
      for (const topic of handlersRef.current.keys()) {
        sendSubscribe(ws, topic);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ message_number: msg.message_number, type: 'pong' }));
        } else if (msg.type === 'subscribed' && msg.topic) {
          activeTopicsRef.current.add(msg.topic);
          if (msg.value != null) dispatch(msg.topic, msg.value);
        } else if (msg.type === 'update' && msg.topic && msg.value != null) {
          dispatch(msg.topic, msg.value);
        } else if (msg.type === 'error') {
          logger.warn('[WsApi] Server error', msg.code, msg.message);
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      activeTopicsRef.current.clear();
      reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30_000);
      logger.debug('[WsApi] Closed, reconnecting in', reconnectDelayRef.current, 'ms');
      reconnectTimerRef.current = setTimeout(connect, reconnectDelayRef.current);
    };

    ws.onerror = () => {
      logger.debug('[WsApi] Error');
    };
  }, [dispatch, sendSubscribe]);

  useEffect(() => {
    mountedRef.current = true;
    if (wsUrl) connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  const subscribe = useCallback(
    (topic: string, handler: Handler): (() => void) => {
      const map = handlersRef.current;
      if (!map.has(topic)) map.set(topic, new Set());
      const handlers = map.get(topic);
      if (handlers) handlers.add(handler);

      // Subscribe on the live connection if not already active.
      if (wsRef.current && !activeTopicsRef.current.has(topic)) {
        sendSubscribe(wsRef.current, topic);
      }

      return () => {
        const handlers = map.get(topic);
        if (!handlers) return;
        handlers.delete(handler);
        if (handlers.size === 0) {
          map.delete(topic);
          // Unsubscribe from server to save bandwidth.
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ topic, type: 'unsubscribe' }));
          }
          activeTopicsRef.current.delete(topic);
        }
      };
    },
    [sendSubscribe],
  );

  const value = useMemo(() => ({ isConnected, subscribe }), [isConnected, subscribe]);

  return <WsApiContext.Provider value={value}>{children}</WsApiContext.Provider>;
}

export function useWsApi() {
  return useContext(WsApiContext);
}
