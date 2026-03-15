/**
 * React Query Configuration
 * Manages server state, caching, and data synchronization
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the global QueryClient instance
 * This handles all server state management across the application
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      // Don't retry mutations automatically (user should explicitly retry)
      retry: false,
    },
    queries: {
      // Time before inactive cache is garbage collected (5 minutes)
      gcTime: 300000,
      // Refetch when reconnecting to network
      refetchOnReconnect: true,
      // Don't refetch on window focus to avoid unnecessary requests
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
      // Consider errors as failed after retry
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Time before data is considered stale (30 seconds)
      staleTime: 30000,
    },
  },
});
