/**
 * Real-time blockchain state subscription via the DCC WebSocket API.
 *
 * Connects to the decentralchain websocket-api service (not the node directly).
 * Uses the topic-based pub/sub protocol:
 *   subscribe   → {"type":"subscribe","topic":"topic://state/{address}/{key}"}
 *   update      → {"type":"update","topic":"...","value":"...","message_number":N}
 *   subscribed  → {"type":"subscribed","topic":"...","value":"...","message_number":N}
 *   ping/pong   → {"type":"ping"/"pong","message_number":N}
 *
 * BPS publishes blockchain state changes to Redis, the ws-api fans them out
 * to all subscribed exchange clients in real time.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '@/config';
import { logger } from '@/lib/logger';

export type StateUpdateHandler = (topic: string, value: string) => void;

interface WsMessage {
  type: 'subscribed' | 'update' | 'unsubscribed' | 'ping' | 'pong' | 'error';
  topic?: string;
  value?: string;
  message_number?: number;
  code?: number;
  message?: string;
}

/**
 * Subscribe to a ws-api topic for a blockchain address.
 *
 * @param address   - The blockchain address (used as default topic address param)
 * @param onUpdate  - Called on every update with (topic, value)
 * @param enabled   - Set to false to pause the subscription
 * @param topic     - Override the topic URI. Defaults to the state wildcard for `address`.
 */
export function useStateSubscription(
  address: string | null | undefined,
  onUpdate: StateUpdateHandler,
  enabled = true,
  topic?: string,
): { isConnected: boolean } {
  const wsUrl = config.wsUrl;
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    reconnectTimerRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: wsUrl and topic come from config/stable args
  useEffect(() => {
    if (!wsUrl || !address || !enabled) {
      cleanup();
      setIsConnected(false);
      return;
    }

    const subscriptionTopic = topic ?? `topic://state?address__in[]=${address}&key__match_any[]=*`;

    let reconnectDelay = 1000;

    const connect = () => {
      if (!mountedRef.current) return;

      logger.debug('[WS] Connecting to', wsUrl);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        logger.debug('[WS] Connected, subscribing to', subscriptionTopic);
        setIsConnected(true);
        reconnectDelay = 1000;
        ws.send(JSON.stringify({ topic: subscriptionTopic, type: 'subscribe' }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WsMessage;
          if (msg.type === 'ping') {
            ws.send(JSON.stringify({ message_number: msg.message_number, type: 'pong' }));
          } else if (
            (msg.type === 'update' || msg.type === 'subscribed') &&
            msg.topic &&
            msg.value != null
          ) {
            onUpdateRef.current(msg.topic, msg.value);
          } else if (msg.type === 'error') {
            logger.warn('[WS] Server error', msg.code, msg.message);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        reconnectDelay = Math.min(reconnectDelay * 2, 30_000);
        logger.debug('[WS] Closed, reconnecting in', reconnectDelay, 'ms');
        reconnectTimerRef.current = setTimeout(connect, reconnectDelay);
      };

      ws.onerror = () => {
        logger.debug('[WS] Error');
      };
    };

    connect();

    return () => {
      cleanup();
      setIsConnected(false);
    };
  }, [wsUrl, address, enabled, cleanup, topic]);

  return { isConnected };
}
