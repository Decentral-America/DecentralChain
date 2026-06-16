/**
 * Subscribe to a ws-api topic using the shared WsApiContext connection.
 *
 * All subscriptions in the app share one WebSocket — topics are multiplexed
 * over it. Reconnect, ping/pong, and re-subscription after reconnect are
 * handled centrally by WsApiProvider.
 */
import { useEffect } from 'react';
import { useWsApi } from '@/contexts/WsApiContext';

export type StateUpdateHandler = (topic: string, value: string) => void;

/**
 * @param address  - The blockchain address (used for default state topic)
 * @param onUpdate - Called on each update: (topic, value)
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

  useEffect(() => {
    if (!enabled || !address) return;

    const subscriptionTopic = topic ?? `topic://state?address__in[]=${address}&key__match_any[]=*`;

    return subscribe(subscriptionTopic, onUpdate);
  }, [enabled, address, topic, subscribe, onUpdate]);

  return { isConnected };
}
