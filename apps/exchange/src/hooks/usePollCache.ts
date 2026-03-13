/**
 * usePollCache Hook
 * Cached polling hook with smart cache invalidation using React Query
 * Provides automatic caching, stale-time management, and background refetching
 */

import { type UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { logger } from '@/lib/logger';

/**
 * Poll Cache Configuration Options
 */
export interface PollCacheOptions {
  /**
   * Polling interval in milliseconds (default: 30000ms = 30s)
   */
  interval?: number;

  /**
   * Cache time in milliseconds - how long inactive data stays in cache (default: 300000ms = 5min)
   */
  cacheTime?: number;

  /**
   * Stale time in milliseconds - how long data is considered fresh (default: 10000ms = 10s)
   */
  staleTime?: number;

  /**
   * Enable/disable automatic polling
   */
  enabled?: boolean;

  /**
   * Refetch on window focus
   */
  refetchOnWindowFocus?: boolean;

  /**
   * Keep previous data while fetching new data
   */
  keepPreviousData?: boolean;

  /**
   * Callback when data is successfully fetched
   */
  onSuccess?: (data: unknown) => void;

  /**
   * Callback when an error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Retry failed requests
   */
  retry?: boolean | number;

  /**
   * Retry delay in milliseconds
   */
  retryDelay?: number;
}

/**
 * Poll Cache Return Type
 */
export interface UsePollCacheReturn<T> {
  /**
   * Cached data
   */
  data: T | undefined;

  /**
   * Loading state (initial fetch)
   */
  isLoading: boolean;

  /**
   * Fetching state (any fetch including background refetches)
   */
  isFetching: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Is data stale (needs refetch)
   */
  isStale: boolean;

  /**
   * Manually invalidate cache and trigger refetch
   */
  invalidate: () => Promise<void>;

  /**
   * Manually trigger refetch
   */
  refetch: () => Promise<void>;

  /**
   * Remove data from cache
   */
  remove: () => void;

  /**
   * Set data manually (optimistic updates)
   */
  setData: (data: T | ((old: T | undefined) => T)) => void;
}

/**
 * Custom hook for cached polling with React Query integration
 * Provides automatic caching, smart invalidation, and background refetching
 *
 * @param key - Query key (string or array) for cache identification
 * @param fetchFn - Async function to fetch data
 * @param options - Configuration options for poll cache
 * @returns Cached data and control functions
 *
 * @example
 * ```tsx
 * const { data, isLoading, invalidate } = usePollCache(
 *   ['market', 'prices'],
 *   async () => {
 *     const response = await fetch('/api/prices');
 *     return response.json();
 *   },
 *   {
 *     interval: 10000, // Poll every 10 seconds
 *     staleTime: 5000, // Data fresh for 5 seconds
 *     cacheTime: 60000, // Keep in cache for 1 minute after last use
 *   }
 * );
 *
 * // Manually invalidate cache
 * <button onClick={invalidate}>Force Refresh</button>
 * ```
 */
export const usePollCache = <T>(
  key: string | string[],
  fetchFn: () => Promise<T>,
  options: PollCacheOptions = {},
): UsePollCacheReturn<T> => {
  const {
    interval = 30000, // Default: 30 seconds
    cacheTime = 300000, // Default: 5 minutes
    staleTime = 10000, // Default: 10 seconds
    enabled = true,
    refetchOnWindowFocus = true,
    keepPreviousData = true,
    onSuccess,
    onError,
    retry = 3,
    retryDelay = 1000,
  } = options;

  const queryClient = useQueryClient();
  const queryKey = Array.isArray(key) ? key : [key];

  /**
   * React Query integration for cached polling
   */
  const { data, isLoading, isFetching, error, isStale, refetch } = useQuery<T, Error>({
    queryKey,
    queryFn: fetchFn,
    refetchInterval: enabled ? interval : false,
    gcTime: cacheTime,
    staleTime,
    enabled,
    refetchOnWindowFocus,
    ...(keepPreviousData && {
      placeholderData: ((previousData: T | undefined) => previousData) as never,
    }),
    retry,
    retryDelay,
  }) as UseQueryResult<T, Error>;

  /**
   * Success/error callbacks
   */
  useCallback(() => {
    if (data && onSuccess) {
      onSuccess(data);
    }
  }, [data, onSuccess]);

  useCallback(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  /**
   * Manually invalidate cache and trigger refetch
   */
  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  /**
   * Remove data from cache
   */
  const remove = useCallback(() => {
    queryClient.removeQueries({ queryKey });
  }, [queryClient, queryKey]);

  /**
   * Set data manually (for optimistic updates)
   */
  const setData = useCallback(
    (data: T | ((old: T | undefined) => T)) => {
      queryClient.setQueryData<T>(queryKey, data);
    },
    [queryClient, queryKey],
  );

  /**
   * Manual refetch wrapper
   */
  const manualRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /**
   * Log cache operations in development
   */
  useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[usePollCache]', {
        key: queryKey,
        isStale,
        isFetching,
        hasData: !!data,
      });
    }
  }, [queryKey, isStale, isFetching, data]);

  return {
    data,
    isLoading,
    isFetching,
    error: error as Error | null,
    isStale,
    invalidate,
    refetch: manualRefetch,
    remove,
    setData,
  };
};

/**
 * Hook variant with automatic invalidation on mount
 * Useful for always fetching fresh data when component mounts
 */
export const usePollCacheFresh = <T>(
  key: string | string[],
  fetchFn: () => Promise<T>,
  options: PollCacheOptions = {},
): UsePollCacheReturn<T> => {
  const result = usePollCache(key, fetchFn, {
    ...options,
    staleTime: 0, // Always stale
  });

  return result;
};

/**
 * Hook variant with infinite cache time
 * Data persists in cache until manually invalidated
 */
export const usePollCachePersistent = <T>(
  key: string | string[],
  fetchFn: () => Promise<T>,
  options: PollCacheOptions = {},
): UsePollCacheReturn<T> => {
  return usePollCache(key, fetchFn, {
    ...options,
    cacheTime: Infinity,
    staleTime: Infinity,
  });
};

/**
 * Hook variant with aggressive caching
 * Optimized for data that rarely changes
 */
export const usePollCacheAggressive = <T>(
  key: string | string[],
  fetchFn: () => Promise<T>,
  options: PollCacheOptions = {},
): UsePollCacheReturn<T> => {
  return usePollCache(key, fetchFn, {
    ...options,
    interval: 60000, // 1 minute
    staleTime: 30000, // 30 seconds
    cacheTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook variant for real-time data
 * Optimized for frequently changing data
 */
export const usePollCacheRealtime = <T>(
  key: string | string[],
  fetchFn: () => Promise<T>,
  options: PollCacheOptions = {},
): UsePollCacheReturn<T> => {
  return usePollCache(key, fetchFn, {
    ...options,
    interval: 5000, // 5 seconds
    staleTime: 2000, // 2 seconds
    cacheTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};
