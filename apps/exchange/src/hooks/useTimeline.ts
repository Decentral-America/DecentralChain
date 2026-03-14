import { useCallback, useRef, useEffect } from 'react';

/**
 * Timer task data structure
 */
interface TimelineTask {
  id: string;
  callback: () => void;
  delay: number;
  startTime: number;
  timeout: NodeJS.Timeout;
  resolve: () => void;
  reject: (error: Error) => void;
}

/**
 * Timeline hook return type
 */
interface UseTimelineReturn {
  /**
   * Schedule a delayed callback
   * @param callback - Function to execute after delay
   * @param delay - Delay in milliseconds
   * @returns Task ID that can be used to cancel
   */
  schedule: (callback: () => void, delay: number) => string;

  /**
   * Schedule a task with custom ID
   * @param id - Custom task ID
   * @param callback - Function to execute after delay
   * @param delay - Delay in milliseconds
   * @returns Task ID
   */
  scheduleWithId: (id: string, callback: () => void, delay: number) => string;

  /**
   * Wait for specified time without callback (returns promise)
   * @param delay - Delay in milliseconds
   * @returns Promise that resolves after delay
   */
  wait: (delay: number) => Promise<void>;

  /**
   * Cancel a scheduled task by ID
   * @param id - Task ID to cancel
   */
  cancel: (id: string) => void;

  /**
   * Cancel all scheduled tasks
   */
  cancelAll: () => void;

  /**
   * Get count of active scheduled tasks
   * @returns Number of active tasks
   */
  getActiveCount: () => number;

  /**
   * Check if a task is scheduled
   * @param id - Task ID to check
   * @returns True if task exists and is active
   */
  hasTask: (id: string) => boolean;

  /**
   * Get remaining time for a task
   * @param id - Task ID
   * @returns Remaining milliseconds, or null if task doesn't exist
   */
  getRemainingTime: (id: string) => number | null;
}

/**
 * Options for useTimeline hook
 */
interface UseTimelineOptions {
  /**
   * Enable development logging
   * @default true in development mode
   */
  debug?: boolean;

  /**
   * Callback when a task is executed
   */
  onTaskExecuted?: (id: string) => void;

  /**
   * Callback when a task is cancelled
   */
  onTaskCancelled?: (id: string) => void;

  /**
   * Callback when an error occurs in a task
   */
  onTaskError?: (id: string, error: Error) => void;
}

/**
 * Generate unique ID for timeline task
 */
let taskIdCounter = 0;
const generateTaskId = (): string => {
  return `timeline-task-${Date.now()}-${++taskIdCounter}`;
};

/**
 * Custom hook for scheduling time-based operations
 *
 * Provides functionality to schedule delayed callbacks, manage timeouts,
 * and wait for specific delays. All tasks are automatically cancelled
 * on component unmount.
 *
 * @param options - Configuration options
 * @returns Timeline control object
 *
 * @example
 * const timeline = useTimeline();
 *
 * // Schedule a callback
 * const taskId = timeline.schedule(() => {
 *   console.log('Executed after 2 seconds');
 * }, 2000);
 *
 * // Wait without callback
 * await timeline.wait(1000);
 *
 * // Cancel a task
 * timeline.cancel(taskId);
 *
 * // Cancel all tasks
 * timeline.cancelAll();
 */
export const useTimeline = (options: UseTimelineOptions = {}): UseTimelineReturn => {
  const { debug = import.meta.env.DEV, onTaskExecuted, onTaskCancelled, onTaskError } = options;

  const tasksRef = useRef<Map<string, TimelineTask>>(new Map());
  const isMountedRef = useRef(true);

  const schedule = useCallback(
    (callback: () => void, delay: number): string => {
      const id = generateTaskId();
      const startTime = Date.now();

      const resolve: () => void = () => {};
      const reject: (error: Error) => void = () => {};

      const timeout = setTimeout(() => {
        if (!isMountedRef.current) return;

        try {
          callback();
          resolve();
          onTaskExecuted?.(id);

          if (debug) {
            const elapsed = Date.now() - startTime;
            console.log(
              `[Timeline] Task executed: ${id} (scheduled: ${delay}ms, actual: ${elapsed}ms)`
            );
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          reject(err);
          onTaskError?.(id, err);

          if (debug) {
            console.error(`[Timeline] Task error: ${id}`, err);
          }
        } finally {
          tasksRef.current.delete(id);
        }
      }, delay);

      const task: TimelineTask = {
        id,
        callback,
        delay,
        startTime,
        timeout,
        resolve: resolve!,
        reject: reject!,
      };

      tasksRef.current.set(id, task);

      if (debug) {
        console.log(
          `[Timeline] Task scheduled: ${id} (delay: ${delay}ms, active tasks: ${tasksRef.current.size})`
        );
      }

      return id;
    },
    [debug, onTaskExecuted, onTaskError]
  );

  const scheduleWithId = useCallback(
    (id: string, callback: () => void, delay: number): string => {
      // Cancel existing task with same ID if it exists
      if (tasksRef.current.has(id)) {
        cancel(id);
      }

      const startTime = Date.now();

      const resolve: () => void = () => {};
      const reject: (error: Error) => void = () => {};

      const timeout = setTimeout(() => {
        if (!isMountedRef.current) return;

        try {
          callback();
          resolve();
          onTaskExecuted?.(id);

          if (debug) {
            const elapsed = Date.now() - startTime;
            console.log(
              `[Timeline] Task executed: ${id} (scheduled: ${delay}ms, actual: ${elapsed}ms)`
            );
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          reject(err);
          onTaskError?.(id, err);

          if (debug) {
            console.error(`[Timeline] Task error: ${id}`, err);
          }
        } finally {
          tasksRef.current.delete(id);
        }
      }, delay);

      const task: TimelineTask = {
        id,
        callback,
        delay,
        startTime,
        timeout,
        resolve: resolve!,
        reject: reject!,
      };

      tasksRef.current.set(id, task);

      if (debug) {
        console.log(
          `[Timeline] Task scheduled with ID: ${id} (delay: ${delay}ms, active tasks: ${tasksRef.current.size})`
        );
      }

      return id;
    },
    [debug, onTaskExecuted, onTaskError]
  );

  const wait = useCallback(
    (delay: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        const id = generateTaskId();
        const startTime = Date.now();

        const timeout = setTimeout(() => {
          if (!isMountedRef.current) {
            reject(new Error('Component unmounted'));
            return;
          }

          resolve();
          tasksRef.current.delete(id);

          if (debug) {
            const elapsed = Date.now() - startTime;
            console.log(
              `[Timeline] Wait completed: ${id} (scheduled: ${delay}ms, actual: ${elapsed}ms)`
            );
          }
        }, delay);

        const task: TimelineTask = {
          id,
          callback: () => {}, // Empty callback for wait
          delay,
          startTime,
          timeout,
          resolve,
          reject,
        };

        tasksRef.current.set(id, task);

        if (debug) {
          console.log(`[Timeline] Wait scheduled: ${id} (delay: ${delay}ms)`);
        }
      });
    },
    [debug]
  );

  const cancel = useCallback(
    (id: string) => {
      const task = tasksRef.current.get(id);
      if (task) {
        clearTimeout(task.timeout);
        task.reject(new Error('Task cancelled'));
        tasksRef.current.delete(id);
        onTaskCancelled?.(id);

        if (debug) {
          console.log(`[Timeline] Task cancelled: ${id}`);
        }
      }
    },
    [debug, onTaskCancelled]
  );

  const cancelAll = useCallback(() => {
    const count = tasksRef.current.size;
    tasksRef.current.forEach((task) => {
      clearTimeout(task.timeout);
      task.reject(new Error('All tasks cancelled'));
    });
    tasksRef.current.clear();

    if (debug) {
      console.log(`[Timeline] All tasks cancelled (${count} tasks)`);
    }
  }, [debug]);

  const getActiveCount = useCallback((): number => {
    return tasksRef.current.size;
  }, []);

  const hasTask = useCallback((id: string): boolean => {
    return tasksRef.current.has(id);
  }, []);

  const getRemainingTime = useCallback((id: string): number | null => {
    const task = tasksRef.current.get(id);
    if (!task) return null;

    const elapsed = Date.now() - task.startTime;
    const remaining = task.delay - elapsed;
    return Math.max(0, remaining);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      tasksRef.current.forEach((task) => {
        clearTimeout(task.timeout);
        task.reject(new Error('Component unmounted'));
      });
      tasksRef.current.clear();
    };
  }, []);

  return {
    schedule,
    scheduleWithId,
    wait,
    cancel,
    cancelAll,
    getActiveCount,
    hasTask,
    getRemainingTime,
  };
};

/**
 * Utility variant: useTimelineWithDebounce
 * Schedule a callback that will be debounced (cancel previous if called again)
 *
 * @example
 * const debounce = useTimelineWithDebounce();
 * debounce('search', () => performSearch(), 500);
 * debounce('search', () => performSearch(), 500); // Cancels previous
 */
export const useTimelineWithDebounce = () => {
  const timeline = useTimeline();

  const debounce = useCallback(
    (id: string, callback: () => void, delay: number) => {
      timeline.scheduleWithId(id, callback, delay);
    },
    [timeline]
  );

  return debounce;
};

/**
 * Utility variant: useInterval
 * Execute a callback repeatedly at fixed intervals
 *
 * @example
 * const { start, stop } = useInterval(() => {
 *   console.log('Every 2 seconds');
 * }, 2000);
 */
export const useInterval = (
  callback: () => void,
  delay: number,
  options: { autoStart?: boolean } = {}
) => {
  const { autoStart = true } = options;
  const timeline = useTimeline();
  const intervalIdRef = useRef<string | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = useCallback(() => {
    if (intervalIdRef.current) {
      timeline.cancel(intervalIdRef.current);
    }

    const runInterval = () => {
      callbackRef.current();
      intervalIdRef.current = timeline.schedule(runInterval, delay);
    };

    intervalIdRef.current = timeline.schedule(runInterval, delay);
  }, [timeline, delay]);

  const stop = useCallback(() => {
    if (intervalIdRef.current) {
      timeline.cancel(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, [timeline]);

  useEffect(() => {
    if (autoStart) {
      start();
    }
    return () => stop();
  }, [autoStart, start, stop]);

  return { start, stop };
};

/**
 * Export types for external usage
 */
export type { TimelineTask, UseTimelineReturn, UseTimelineOptions };
