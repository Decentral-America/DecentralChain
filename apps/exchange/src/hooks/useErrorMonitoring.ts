/**
 * Error Monitoring Hooks
 *
 * React hooks for error tracking and monitoring
 */

import { useCallback, useEffect } from 'react';
import {
  addBreadcrumb,
  captureError,
  type ErrorContext,
  ErrorSeverity,
} from '@/lib/errorMonitoring';

/**
 * Track errors in a component
 *
 * @param error - Error to track
 * @param context - Additional context
 *
 * @example
 * ```tsx
 * function DataComponent() {
 *   const { data, error } = useQuery({
 *     queryKey: ['data'],
 *     queryFn: fetchData,
 *   });
 *
 *   useErrorMonitoring(error, { component: 'DataComponent' });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useErrorMonitoring(error: Error | null | undefined, context?: ErrorContext): void {
  useEffect(() => {
    if (error) {
      captureError(error, context);
    }
  }, [error, context]);
}

/**
 * Get error capture function
 *
 * @returns Function to capture errors
 *
 * @example
 * ```tsx
 * function SendButton() {
 *   const captureErr = useErrorCapture();
 *
 *   const handleSend = async () => {
 *     try {
 *       await sendTransaction();
 *     } catch (error) {
 *       captureErr(error, { operation: 'send' });
 *     }
 *   };
 * }
 * ```
 */
export function useErrorCapture() {
  return useCallback((error: Error | string, context?: ErrorContext, severity?: ErrorSeverity) => {
    captureError(error, context, severity);
  }, []);
}

/**
 * Add breadcrumb tracking for user actions
 *
 * @param category - Breadcrumb category
 * @returns Function to add breadcrumbs
 *
 * @example
 * ```tsx
 * function SendButton() {
 *   const addCrumb = useBreadcrumb('user-action');
 *
 *   const handleClick = () => {
 *     addCrumb('User clicked send button', { amount: 100 });
 *     // ... handle send ...
 *   };
 * }
 * ```
 */
export function useBreadcrumb(category: string) {
  return useCallback(
    (message: string, data?: ErrorContext, level: ErrorSeverity = ErrorSeverity.Info) => {
      addBreadcrumb(message, category, level, data);
    },
    [category],
  );
}

/**
 * Track API errors automatically
 *
 * @example
 * ```tsx
 * function useTransactions() {
 *   const trackApiError = useApiErrorTracking();
 *
 *   const { data, error } = useQuery({
 *     queryKey: ['transactions'],
 *     queryFn: fetchTransactions,
 *     onError: (error) => {
 *       trackApiError('fetchTransactions', error);
 *     },
 *   });
 * }
 * ```
 */
export function useApiErrorTracking() {
  return useCallback((endpoint: string, error: Error, context?: ErrorContext) => {
    captureError(
      error,
      {
        endpoint,
        type: 'api',
        ...context,
      },
      ErrorSeverity.Error,
    );
  }, []);
}

/**
 * Track component lifecycle for debugging
 *
 * @param componentName - Name of the component
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   useComponentLifecycleTracking('Dashboard');
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useComponentLifecycleTracking(componentName: string): void {
  useEffect(() => {
    addBreadcrumb(`${componentName} mounted`, 'component-lifecycle', ErrorSeverity.Debug);

    return () => {
      addBreadcrumb(`${componentName} unmounted`, 'component-lifecycle', ErrorSeverity.Debug);
    };
  }, [componentName]);
}
