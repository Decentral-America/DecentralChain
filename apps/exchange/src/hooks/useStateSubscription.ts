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
 * Subscribe to all state changes for a blockchain address via the DCC ws-api.
 * Uses a multi-topic wildcard: topic://state?address__in[]={address}&key__match_any[]=*
 *
 * @param address   - The blockchain address to watch
 * @param onUpdate  - Called whenever any state key for that address changes
 * @param enabled   - Set to false to pause the subscription
 */
export function useStateSubscription(
  address: string | null | undefined,
  onUpdate: StateUpdateHandler,
  enabled = true,
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: wsUrl comes from config (build-time constant), not a reactive value
  useEffect(() => {
    if (!wsUrl || !address || !enabled) {
      cleanup();
      setIsConnected(false);
      return;
    }

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
        logger.debug('[WS] Connected');
        setIsConnected(true);
        reconnectDelay = 1000;

        // Subscribe to all state changes for the address using multi-topic syntax
        const topic = `topic://state?address__in[]=${address}&key__match_any[]=*`;
        ws.send(JSON.stringify({ topic, type: 'subscribe' }));
        // The server drives the ping/pong cycle — we only respond to server pings
        // (handled in onmessage). Sending unsolicited pongs breaks the protocol:
        // the server validates pong.message_number against a previously-issued ping,
        // rejects mismatches, and closes the connection.
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
        // Exponential backoff reconnect, cap at 30s
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
  }, [wsUrl, address, enabled, cleanup]);

  return { isConnected };
}
