/**
 * useQueue Hook
 * Request queue management for sequential API calls
 * Ensures operations execute one at a time in FIFO order
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * Queue Item Interface
 */
interface QueueItem<T> {
  /**
   * Unique identifier for the queue item
   */
  id: string;

  /**
   * Async task to execute
   */
  task: () => Promise<T>;

  /**
   * Promise resolve callback
   */
  resolve: (value: T) => void;

  /**
   * Promise reject callback
   */
  reject: (error: Error) => void;

  /**
   * Priority level (higher = earlier execution)
   */
  priority?: number | undefined;

  /**
   * Timestamp when item was added
   */
  timestamp: number;
}

async function processQueueItem<T>(
  item: QueueItem<T>,
  onComplete?: <U>(result: U) => void,
  onError?: (error: Error) => void,
): Promise<void> {
  try {
    const result = await item.task();
    item.resolve(result);
    onComplete?.(result);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    item.reject(err);
    onError?.(err);
    if (process.env.NODE_ENV === 'development') logger.error('[useQueue] Task error:', err);
  }
}

/**
 * Queue Configuration Options
 */
export interface UseQueueOptions {
  /**
   * Maximum queue size (default: unlimited)
   */
  maxSize?: number;

  /**
   * Auto-start processing on mount (default: true)
   */
  autoStart?: boolean;

  /**
   * Callback when queue is empty
   */
  onEmpty?: () => void;

  /**
   * Callback when queue reaches max size
   */
  onMaxSize?: () => void;

  /**
   * Callback on each item completion
   */
  onItemComplete?: <T>(result: T) => void;

  /**
   * Callback on each item error
   */
  onItemError?: (error: Error) => void;
}

/**
 * Queue Return Type
 */
export interface UseQueueReturn<T> {
  /**
   * Add task to queue
   */
  enqueue: (task: () => Promise<T>, priority?: number) => Promise<T>;

  /**
   * Remove all items from queue
   */
  clear: () => void;

  /**
   * Pause queue processing
   */
  pause: () => void;

  /**
   * Resume queue processing
   */
  resume: () => void;

  /**
   * Is queue currently processing
   */
  isProcessing: boolean;

  /**
   * Is queue paused
   */
  isPaused: boolean;

  /**
   * Current queue length
   */
  queueLength: number;

  /**
   * Get all queued items (for debugging)
   */
  getQueue: () => ReadonlyArray<{ id: string; timestamp: number; priority?: number | undefined }>;
}

/**
 * Custom hook for managing sequential request queues
 * Ensures API calls or async operations execute one at a time in order
 *
 * @param options - Configuration options for queue behavior
 * @returns Queue management functions and state
 *
 * @example
 * ```tsx
 * const { enqueue, isProcessing, queueLength } = useQueue({
 *   maxSize: 10,
 *   onEmpty: () => logger.debug('Queue cleared'),
 * });
 *
 * // Add tasks to queue
 * const result = await enqueue(async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * });
 *
 * // High priority task
 * await enqueue(async () => criticalOperation(), 10);
 * ```
 */
export const useQueue = <T = unknown>(options: UseQueueOptions = {}): UseQueueReturn<T> => {
  const { maxSize, autoStart = true, onEmpty, onMaxSize, onItemComplete, onItemError } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(!autoStart);
  const [queueLength, setQueueLength] = useState(0);

  const queueRef = useRef<QueueItem<T>[]>([]);
  const processingRef = useRef(false);
  const isMountedRef = useRef(true);

  /**
   * Process queue sequentially
   */
  const processQueue = useCallback(async () => {
    if (processingRef.current || isPaused || queueRef.current.length === 0) return;

    processingRef.current = true;
    if (isMountedRef.current) setIsProcessing(true);

    while (queueRef.current.length > 0 && !isPaused) {
      queueRef.current.sort(
        (a, b) => (b.priority || 0) - (a.priority || 0) || a.timestamp - b.timestamp,
      );

      const item = queueRef.current.shift();
      if (!item) break;

      if (isMountedRef.current) setQueueLength(queueRef.current.length);

      await processQueueItem(item, onItemComplete, onItemError);
    }

    processingRef.current = false;
    if (isMountedRef.current) {
      setIsProcessing(false);
      if (queueRef.current.length === 0) onEmpty?.();
    }
  }, [isPaused, onEmpty, onItemComplete, onItemError]);

  /**
   * Add task to queue
   */
  const enqueue = useCallback(
    (task: () => Promise<T>, priority?: number): Promise<T> => {
      return new Promise((resolve, reject) => {
        // Check max size
        if (maxSize && queueRef.current.length >= maxSize) {
          onMaxSize?.();
          reject(new Error(`Queue is full (max size: ${maxSize})`));
          return;
        }

        const item: QueueItem<T> = {
          id: crypto.randomUUID(),
          priority,
          reject,
          resolve,
          task,
          timestamp: Date.now(),
        };

        queueRef.current.push(item);

        if (isMountedRef.current) {
          setQueueLength(queueRef.current.length);
        }

        // Auto-start processing if not paused
        if (!isPaused) {
          processQueue();
        }
      });
    },
    [maxSize, isPaused, processQueue, onMaxSize],
  );

  /**
   * Clear all queued items
   */
  const clear = useCallback(() => {
    queueRef.current.forEach((item) => {
      item.reject(new Error('Queue cleared'));
    });
    queueRef.current = [];

    if (isMountedRef.current) {
      setQueueLength(0);
    }
  }, []);

  /**
   * Pause queue processing
   */
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  /**
   * Resume queue processing
   */
  const resume = useCallback(() => {
    setIsPaused(false);
    processQueue();
  }, [processQueue]);

  /**
   * Get queue snapshot for debugging
   */
  const getQueue = useCallback(() => {
    return queueRef.current.map((item) => ({
      id: item.id,
      priority: item.priority,
      timestamp: item.timestamp,
    }));
  }, []);

  /**
   * Track mounted state
   */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clear queue on unmount
      clear();
    };
  }, [clear]);

  /**
   * Log queue state in development
   */
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[useQueue]', {
        isPaused,
        isProcessing,
        queueLength,
      });
    }
  }, [queueLength, isProcessing, isPaused]);

  return {
    clear,
    enqueue,
    getQueue,
    isPaused,
    isProcessing,
    pause,
    queueLength,
    resume,
  };
};

/**
 * Hook variant with automatic retry on failure
 * Retries failed tasks up to maxRetries times
 */
export const useQueueWithRetry = <T = unknown>(
  maxRetries = 3,
  retryDelay = 1000,
  options: UseQueueOptions = {},
): UseQueueReturn<T> => {
  const queue = useQueue<T>(options);

  const enqueueWithRetry = useCallback(
    async (task: () => Promise<T>, priority?: number): Promise<T> => {
      let lastError: Error | undefined;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await queue.enqueue(task, priority);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Don't retry if it's the last attempt
          if (attempt < maxRetries) {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
          }
        }
      }

      throw lastError;
    },
    [queue, maxRetries, retryDelay],
  );

  return {
    ...queue,
    enqueue: enqueueWithRetry,
  };
};
