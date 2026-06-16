/**
 * Subscribe to a ws-api topic using the shared WsApiContext connection.
 *
 * All subscriptions in the app share one WebSocket — topics are multiplexed
 * over it. Reconnect, ping/pong, and re-subscription after reconnect are
 * handled centrally by WsApiProvider.
 */
import { useEffect, useRef } from 'react';
import { useWsApi } from '@/contexts/WsApiContext';

export type StateUpdateHandler = (topic: string, value: string) => void;

/**
 * @param address  - The blockchain address (used for default state topic)
 * @param onUpdate - Called on each update: (topic, value). Does NOT need to be
 *                   memoized — the subscription is stable regardless of handler identity.
 * @param enabled  - Pause the subscription without unmounting
 * @param topic    - Override topic URI (default: state wildcard for address)
 */
export function useStateSubscription(
  address: string | null | undefined,
  onUpdate: StateUpdateHandler,
  enabled = true,
  topic?: string,
): { isConnected: boolean } {
  const { isConnected, subscribe } = useWsApi();

  // Ref wrapper so the subscription never re-runs just because the caller
  // passed a new function reference — only topic/address/enabled changes matter.
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // biome-ignore lint/correctness/useExhaustiveDependencies: onUpdate intentionally excluded — ref handles latest value
  useEffect(() => {
    if (!enabled || !address) return;

    const subscriptionTopic = topic ?? `topic://state?address__in[]=${address}&key__match_any[]=*`;
    const stableHandler: StateUpdateHandler = (t, v) => onUpdateRef.current(t, v);

    return subscribe(subscriptionTopic, stableHandler);
  }, [enabled, address, topic, subscribe]);

  return { isConnected };
}
