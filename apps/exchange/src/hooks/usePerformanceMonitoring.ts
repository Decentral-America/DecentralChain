/**
 * Performance Monitoring Hooks
 *
 * React hooks for performance tracking
 */

import { useEffect, useRef } from 'react';
import {
  markPerformance,
  measurePerformance,
  clearPerformance,
  performance as perfTracking,
} from '@/lib/performanceMonitoring';

/**
 * Track component render time
 *
 * @param componentName - Name of the component
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   useRenderTime('Dashboard');
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useRenderTime(componentName: string): void {
  const renderCount = useRef(0);

  useEffect(() => {
    const markName = `${componentName}-render-${renderCount.current}`;
    const startMark = `${markName}-start`;
    const endMark = `${markName}-end`;

    // Mark start
    markPerformance(startMark);

    return () => {
      // Mark end and measure
      markPerformance(endMark);
      const duration = measurePerformance(markName, startMark, endMark);

      if (duration !== null) {
        perfTracking.componentRender(componentName, duration);
      }

      // Clean up marks
      clearPerformance(startMark);
      clearPerformance(endMark);
      clearPerformance(markName);

      renderCount.current++;
    };
  });
}

/**
 * Track route change performance
 *
 * @example
 * ```tsx
 * function App() {
 *   useRoutePerformance();
 *
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */
export function useRoutePerformance(): void {
  const prevPath = useRef<string>('');
  const routeStartTime = useRef<number>(0);

  useEffect(() => {
    const currentPath = window.location.pathname;

    // Don't track initial load
    if (!prevPath.current) {
      prevPath.current = currentPath;
      return;
    }

    // Track route change
    if (currentPath !== prevPath.current) {
      routeStartTime.current = performance.now();
      prevPath.current = currentPath;
    }
  }, []);

  useEffect(() => {
    // Measure route change time
    if (routeStartTime.current > 0) {
      const duration = performance.now() - routeStartTime.current;
      perfTracking.routeChange(window.location.pathname, duration);
      routeStartTime.current = 0;
    }
  });
}

/**
 * Track data loading performance
 *
 * @param key - Unique key for the data loading operation
 * @param isLoading - Whether data is currently loading
 *
 * @example
 * ```tsx
 * function TransactionList() {
 *   const { data, isLoading } = useQuery({
 *     queryKey: ['transactions'],
 *     queryFn: fetchTransactions,
 *   });
 *
 *   useDataLoadPerformance('transactions', isLoading);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useDataLoadPerformance(key: string, isLoading: boolean): void {
  const loadStartTime = useRef<number>(0);

  useEffect(() => {
    if (isLoading && loadStartTime.current === 0) {
      loadStartTime.current = performance.now();
    } else if (!isLoading && loadStartTime.current > 0) {
      const duration = performance.now() - loadStartTime.current;
      perfTracking.dataLoad(key, duration);
      loadStartTime.current = 0;
    }
  }, [isLoading, key]);
}

/**
 * Track API call performance
 *
 * @param endpoint - API endpoint name
 * @returns Function to call when API request completes
 *
 * @example
 * ```tsx
 * function useTransactions() {
 *   const markApiComplete = useApiPerformance('fetchTransactions');
 *
 *   const { data } = useQuery({
 *     queryKey: ['transactions'],
 *     queryFn: async () => {
 *       const result = await fetch('/api/transactions');
 *       markApiComplete();
 *       return result;
 *     },
 *   });
 * }
 * ```
 */
export function useApiPerformance(endpoint: string) {
  const startTime = useRef<number>(0);

  // Start tracking on mount
  useEffect(() => {
    startTime.current = performance.now();
  }, []);

  // Return function to mark completion
  return () => {
    if (startTime.current > 0) {
      const duration = performance.now() - startTime.current;
      perfTracking.apiCall(endpoint, duration);
      startTime.current = 0;
    }
  };
}

/**
 * Track custom performance metric
 *
 * @param name - Metric name
 * @returns Object with start and end functions
 *
 * @example
 * ```tsx
 * function ComplexComponent() {
 *   const { start, end } = usePerformanceMetric('complex-calculation');
 *
 *   const handleCalculation = () => {
 *     start();
 *     // ... complex calculation ...
 *     end();
 *   };
 * }
 * ```
 */
export function usePerformanceMetric(name: string) {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;

  const start = () => {
    markPerformance(startMark);
  };

  const end = () => {
    markPerformance(endMark);
    const duration = measurePerformance(name, startMark, endMark);

    // Clean up marks
    clearPerformance(startMark);
    clearPerformance(endMark);
    clearPerformance(name);

    return duration;
  };

  return { start, end };
}
