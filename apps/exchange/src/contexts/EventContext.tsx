import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { logger } from '@/lib/logger';

/**
 * Event handler function type that can accept any arguments
 */
type EventHandler<T = unknown> = (...args: T[]) => void;

/**
 * Map structure for organizing event subscriptions
 * Key: event name, Value: Set of handler functions
 */
type EventMap = Map<string, Set<EventHandler>>;

/**
 * Event subscription return type with unsubscribe method
 */
interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * EventManager context interface providing pub/sub functionality
 */
interface EventContextValue {
  /**
   * Emit an event with optional arguments to all subscribers
   * @param event - Event name to emit
   * @param args - Arguments to pass to event handlers
   */
  emit: (event: string, ...args: unknown[]) => void;

  /**
   * Subscribe to an event with a handler function
   * @param event - Event name to subscribe to
   * @param handler - Function to call when event is emitted
   * @returns Subscription object with unsubscribe method
   */
  subscribe: (event: string, handler: EventHandler) => EventSubscription;

  /**
   * Unsubscribe a handler from an event
   * @param event - Event name to unsubscribe from
   * @param handler - Handler function to remove
   */
  unsubscribe: (event: string, handler: EventHandler) => void;

  /**
   * Remove all handlers for a specific event
   * @param event - Event name to clear handlers for
   */
  clearEvent: (event: string) => void;

  /**
   * Remove all event handlers for all events
   */
  clearAllEvents: () => void;

  /**
   * Get count of active event listeners
   * @param event - Optional event name to get count for specific event
   * @returns Number of active listeners
   */
  getListenerCount: (event?: string) => number;

  /**
   * Get list of all registered event names
   * @returns Array of event names
   */
  getEventNames: () => string[];
}

/**
 * EventContext - React Context for global event management
 */
const EventContext = createContext<EventContextValue | null>(null);

/**
 * Event names for common application events
 * Provides type-safe event name constants
 */
export const EventNames = {
  ASSET_BURNED: 'asset:burned',

  // Asset events
  ASSET_ISSUED: 'asset:issued',
  ASSET_REISSUED: 'asset:reissued',
  DATA_ERROR: 'data:error',

  // Data events
  DATA_REFRESHED: 'data:refreshed',
  DEX_ORDER_CANCELLED: 'dex:order:cancelled',

  // DEX events
  DEX_ORDER_CREATED: 'dex:order:created',
  DEX_ORDER_FILLED: 'dex:order:filled',
  DEX_PAIR_CHANGED: 'dex:pair:changed',

  // Network events
  NETWORK_CHANGED: 'network:changed',
  NETWORK_CONNECTION_LOST: 'network:connection:lost',
  NETWORK_CONNECTION_RESTORED: 'network:connection:restored',
  TRANSACTION_BROADCAST: 'transaction:broadcast',
  TRANSACTION_CONFIRMED: 'transaction:confirmed',

  // Transaction events
  TRANSACTION_CREATED: 'transaction:created',
  TRANSACTION_FAILED: 'transaction:failed',
  TRANSACTION_SIGNED: 'transaction:signed',
  UI_LANGUAGE_CHANGED: 'ui:language:changed',
  UI_MODAL_CLOSED: 'ui:modal:closed',

  // UI events
  UI_MODAL_OPENED: 'ui:modal:opened',
  UI_THEME_CHANGED: 'ui:theme:changed',
  WALLET_ACCOUNT_CHANGED: 'wallet:account:changed',
  // Wallet events
  WALLET_BALANCE_UPDATED: 'wallet:balance:updated',
  WALLET_CONNECTED: 'wallet:connected',
  WALLET_DISCONNECTED: 'wallet:disconnected',
} as const;

/**
 * EventProvider component - Wraps application with event management context
 */
export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const eventsRef = useRef<EventMap>(new Map());

  const emit = useCallback((event: string, ...args: unknown[]) => {
    const handlers = eventsRef.current.get(event);
    if (handlers) {
      // Execute handlers in registration order
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          logger.error(`Error executing handler for event "${event}":`, error);
        }
      });
    }

    // Development logging
    if (import.meta.env.DEV) {
      logger.debug(`[EventManager] Event emitted: ${event}`, args);
    }
  }, []);

  const subscribe = useCallback((event: string, handler: EventHandler): EventSubscription => {
    if (!eventsRef.current.has(event)) {
      eventsRef.current.set(event, new Set());
    }
    eventsRef.current.get(event)?.add(handler);

    // Development logging
    if (import.meta.env.DEV) {
      logger.debug(`[EventManager] Subscribed to: ${event}`, {
        totalListeners: eventsRef.current.get(event)?.size,
      });
    }

    // Return subscription object with unsubscribe method
    return {
      unsubscribe: () => {
        const handlers = eventsRef.current.get(event);
        if (handlers) {
          handlers.delete(handler);
          if (import.meta.env.DEV) {
            logger.debug(`[EventManager] Unsubscribed from: ${event}`);
          }
        }
      },
    };
  }, []);

  const unsubscribe = useCallback((event: string, handler: EventHandler) => {
    const handlers = eventsRef.current.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (import.meta.env.DEV) {
        logger.debug(`[EventManager] Handler removed from: ${event}`);
      }
    }
  }, []);

  const clearEvent = useCallback((event: string) => {
    eventsRef.current.delete(event);
    if (import.meta.env.DEV) {
      logger.debug(`[EventManager] Cleared all handlers for: ${event}`);
    }
  }, []);

  const clearAllEvents = useCallback(() => {
    const eventCount = eventsRef.current.size;
    eventsRef.current.clear();
    if (import.meta.env.DEV) {
      logger.debug(`[EventManager] Cleared all events (${eventCount} events)`);
    }
  }, []);

  const getListenerCount = useCallback((event?: string): number => {
    if (event) {
      const handlers = eventsRef.current.get(event);
      return handlers ? handlers.size : 0;
    }
    // Return total count across all events
    return Array.from(eventsRef.current.values()).reduce(
      (total, handlers) => total + handlers.size,
      0,
    );
  }, []);

  const getEventNames = useCallback((): string[] => {
    return Array.from(eventsRef.current.keys());
  }, []);

  const value: EventContextValue = {
    clearAllEvents,
    clearEvent,
    emit,
    getEventNames,
    getListenerCount,
    subscribe,
    unsubscribe,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

/**
 * Custom hook to access EventManager functionality
 * Must be used within EventProvider component tree
 * @throws Error if used outside EventProvider
 */
export const useEventManager = (): EventContextValue => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventManager must be used within EventProvider');
  }
  return context;
};

/**
 * Custom hook for automatic event subscription with cleanup
 * Automatically unsubscribes when component unmounts
 * @param event - Event name to subscribe to
 * @param handler - Handler function to call when event is emitted
 * @param deps - Dependency array for handler function
 * @example
 * useEvent('transaction:confirmed', (txId) => {
 *   logger.debug('Transaction confirmed:', txId);
 * }, []);
 */
export const useEvent = (
  event: string,
  handler: EventHandler,
  deps: React.DependencyList = [],
): void => {
  const { subscribe } = useEventManager();

  useEffect(() => {
    const subscription = subscribe(event, handler);
    return () => subscription.unsubscribe();
  }, [event, subscribe, ...deps, handler]);
};

/**
 * Custom hook to get emit function only
 * Useful when component only needs to emit events, not subscribe
 * @returns emit function
 * @example
 * const emit = useEmit();
 * emit('transaction:created', transaction);
 */
export const useEmit = () => {
  const { emit } = useEventManager();
  return emit;
};

/**
 * Custom hook for one-time event listener
 * Automatically unsubscribes after first event emission
 * @param event - Event name to listen for
 * @param handler - Handler function to call once
 * @param deps - Dependency array for handler function
 * @example
 * useEventOnce('wallet:connected', () => {
 *   logger.debug('Wallet connected for the first time!');
 * }, []);
 */
export const useEventOnce = (
  event: string,
  handler: EventHandler,
  deps: React.DependencyList = [],
): void => {
  const { subscribe } = useEventManager();
  const hasCalledRef = useRef(false);

  useEffect(() => {
    if (hasCalledRef.current) return;

    const wrappedHandler: EventHandler = (...args) => {
      if (!hasCalledRef.current) {
        hasCalledRef.current = true;
        handler(...args);
        subscription.unsubscribe();
      }
    };

    const subscription = subscribe(event, wrappedHandler);

    return () => {
      subscription.unsubscribe();
    };
  }, [event, subscribe, ...deps, handler]);
};

/**
 * Type-safe event emitter for specific event types
 * @example
 * const emit = useTypedEmit<{ txId: string; amount: number }>();
 * emit('transaction:confirmed', { txId: '123', amount: 100 });
 */
export const useTypedEmit = <T = unknown>() => {
  const { emit } = useEventManager();
  return useCallback(
    (event: string, data: T) => {
      emit(event, data);
    },
    [emit],
  );
};

/**
 * Export types for external usage
 */
export type { EventContextValue, EventHandler, EventSubscription };
/**
 * Export EventContext for advanced usage
 */
export { EventContext };
