/**
 * usePoll Hook
 * Generic polling mechanism for any async operation with start/stop control
 * Provides automatic interval-based execution with error handling
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * Polling Configuration Options
 */
export interface UsePollOptions<T> {
  /**
   * Polling interval in milliseconds (default: 30000ms = 30s)
   */
  interval?: number;

  /**
   * Enable/disable automatic polling on mount
   */
  enabled?: boolean;

  /**
   * Execute immediately on mount before first interval
   */
  executeImmediately?: boolean;

  /**
   * Callback when data is successfully fetched
   */
  onData?: (data: T) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Callback on each polling cycle start
   */
  onPollStart?: () => void;

  /**
   * Callback on each polling cycle end
   */
  onPollEnd?: () => void;
}

/**
 * Polling Return Type
 */
export interface UsePollReturn<T> {
  /**
   * Latest polled data
   */
  data: T | null;

  /**
   * Latest error if any
   */
  error: Error | null;

  /**
   * Is currently polling
   */
  isPolling: boolean;

  /**
   * Is currently fetching data
   */
  isLoading: boolean;

  /**
   * Start automatic polling
   */
  startPolling: () => void;

  /**
   * Stop automatic polling
   */
  stopPolling: () => void;

  /**
   * Manually trigger a single poll execution
   */
  refresh: () => Promise<void>;

  /**
   * Reset data and error state
   */
  reset: () => void;
}

/**
 * Custom hook for generic polling of any async operation
 * Executes a callback function at regular intervals with control methods
 *
 * @param pollFn - Async function to execute at each interval
 * @param options - Configuration options for polling behavior
 * @returns Polling state and control functions
 *
 * @example
 * ```tsx
 * const { data, isLoading, startPolling, stopPolling } = usePoll(
 *   async () => {
 *     const response = await fetch('/api/status');
 *     return response.json();
 *   },
 *   {
 *     interval: 5000, // Poll every 5 seconds
 *     onData: (data) => logger.debug('New data:', data),
 *     onError: (error) => logger.error('Poll error:', error)
 *   }
 * );
 *
 * // Control polling manually
 * <button onClick={startPolling}>Start</button>
 * <button onClick={stopPolling}>Stop</button>
 * ```
 */
export const usePoll = <T>(
  pollFn: () => Promise<T>,
  options: UsePollOptions<T> = {},
): UsePollReturn<T> => {
  const {
    interval = 30000, // Default: 30 seconds
    enabled = true,
    executeImmediately = true,
    onData,
    onError,
    onPollStart,
    onPollEnd,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(enabled);
  const [isLoading, setIsLoading] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Execute a single poll cycle
   */
  const executePoll = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    onPollStart?.();

    try {
      const result = await pollFn();

      if (!isMountedRef.current) return;

      setData(result);
      setError(null);
      onData?.(result);
    } catch (err) {
      if (!isMountedRef.current) return;

      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);

      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        logger.error('[usePoll] Poll error:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        onPollEnd?.();
      }
    }
  }, [pollFn, onData, onError, onPollStart, onPollEnd]);

  /**
   * Start polling effect
   */
  useEffect(() => {
    if (!isPolling) {
      // Clear interval when polling is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Execute immediately on start if configured
    if (executeImmediately) {
      void executePoll();
    }

    // Set up interval for subsequent polls
    intervalRef.current = setInterval(executePoll, interval);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPolling, interval, executePoll, executeImmediately]);

  /**
   * Track mounted state to prevent state updates after unmount
   */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Start automatic polling
   */
  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  /**
   * Stop automatic polling
   */
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  /**
   * Manually trigger a single poll execution
   */
  const refresh = useCallback(async () => {
    await executePoll();
  }, [executePoll]);

  /**
   * Reset data and error state
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    error,
    isLoading,
    isPolling,
    refresh,
    reset,
    startPolling,
    stopPolling,
  };
};

/**
 * Hook variant with automatic data transformation
 * Applies a transformation function to polled data before storing
 */
export const usePollWithTransform = <T, R>(
  pollFn: () => Promise<T>,
  transformFn: (data: T) => R,
  options: UsePollOptions<R> = {},
): UsePollReturn<R> => {
  const transformedPollFn = useCallback(async () => {
    const data = await pollFn();
    return transformFn(data);
  }, [pollFn, transformFn]);

  return usePoll(transformedPollFn, options);
};

/**
 * Hook variant with conditional polling
 * Only polls when a condition function returns true
 */
export const usePollConditional = <T>(
  pollFn: () => Promise<T>,
  conditionFn: () => boolean,
  options: UsePollOptions<T> = {},
): UsePollReturn<T> => {
  const conditionalPollFn = useCallback(async () => {
    if (!conditionFn()) {
      throw new Error('Poll condition not met');
    }
    return pollFn();
  }, [pollFn, conditionFn]);

  return usePoll(conditionalPollFn, options);
};
