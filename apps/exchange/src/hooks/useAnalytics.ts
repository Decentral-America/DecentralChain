/**
 * Analytics Hooks
 *
 * React hooks for analytics tracking
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackEvent, trackTiming, type EventParams } from '@/lib/analytics';

/**
 * Track page views automatically on route changes
 *
 * @example
 * ```tsx
 * function App() {
 *   usePageTracking();
 *
 *   return <RouterProvider router={router} />;
 * }
 * ```
 */
export function usePageTracking(): void {
  const location = useLocation();
  const previousPath = useRef<string>('');

  useEffect(() => {
    if (location.pathname !== previousPath.current) {
      trackPageView(location.pathname);
      previousPath.current = location.pathname;
    }
  }, [location]);
}

/**
 * Track component mount time
 *
 * @param componentName - Name of the component
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   useComponentTiming('Dashboard');
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useComponentTiming(componentName: string): void {
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const mountTime = Date.now() - startTime;
      trackTiming('Component', 'mount_time', mountTime, componentName);
    };
  }, [componentName]);
}

/**
 * Track API call timing
 *
 * @returns Function to track API timing
 *
 * @example
 * ```tsx
 * function useTransactions() {
 *   const trackApiTiming = useApiTiming();
 *
 *   const { data } = useQuery({
 *     queryKey: ['transactions'],
 *     queryFn: async () => {
 *       return trackApiTiming('fetch_transactions', async () => {
 *         return await api.getTransactions();
 *       });
 *     },
 *   });
 * }
 * ```
 */
export function useApiTiming() {
  return async <T>(apiName: string, apiCall: () => Promise<T>): Promise<T> => {
    const startTime = Date.now();

    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      trackTiming('API', apiName, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackTiming('API', `${apiName}_error`, duration);
      throw error;
    }
  };
}

/**
 * Track event with automatic component context
 *
 * @param category - Event category
 * @returns Function to track events
 *
 * @example
 * ```tsx
 * function SendButton() {
 *   const track = useAnalytics('Transaction');
 *
 *   const handleSend = () => {
 *     track('send', 'DCC', 100);
 *   };
 *
 *   return <Button onClick={handleSend}>Send</Button>;
 * }
 * ```
 */
export function useAnalytics(category: string) {
  return (action: string, label?: string, value?: number, params?: EventParams) => {
    trackEvent(category, action, label, value, params);
  };
}

/**
 * Track feature usage
 *
 * @param featureName - Name of the feature
 *
 * @example
 * ```tsx
 * function AdvancedFeature() {
 *   useFeatureTracking('advanced_trading');
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useFeatureTracking(featureName: string): void {
  useEffect(() => {
    trackEvent('Feature', 'used', featureName);
  }, [featureName]);
}

/**
 * Track form submission
 *
 * @param formName - Name of the form
 * @returns Object with track functions
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { trackStart, trackComplete, trackError } = useFormTracking('login');
 *
 *   const handleSubmit = async (data) => {
 *     trackStart();
 *     try {
 *       await login(data);
 *       trackComplete();
 *     } catch (error) {
 *       trackError(error.message);
 *     }
 *   };
 * }
 * ```
 */
export function useFormTracking(formName: string) {
  const startTimeRef = useRef<number>(0);

  const trackStart = () => {
    startTimeRef.current = Date.now();
    trackEvent('Form', 'start', formName);
  };

  const trackComplete = () => {
    const duration = Date.now() - startTimeRef.current;
    trackEvent('Form', 'complete', formName, duration);
  };

  const trackError = (errorMessage: string) => {
    trackEvent('Form', 'error', formName, undefined, {
      error: errorMessage,
    });
  };

  const trackFieldChange = (fieldName: string) => {
    trackEvent('Form', 'field_change', `${formName}_${fieldName}`);
  };

  return {
    trackStart,
    trackComplete,
    trackError,
    trackFieldChange,
  };
}

/**
 * Track button clicks
 *
 * @param buttonName - Name of the button
 * @param metadata - Optional metadata
 * @returns Click handler function
 *
 * @example
 * ```tsx
 * function SendButton() {
 *   const handleClick = useButtonTracking('send_transaction', {
 *     asset: 'DCC',
 *     amount: 100,
 *   });
 *
 *   return (
 *     <Button onClick={(e) => {
 *       handleClick(e);
 *       // ... your logic ...
 *     }}>
 *       Send
 *     </Button>
 *   );
 * }
 * ```
 */
export function useButtonTracking(buttonName: string, metadata?: EventParams) {
  return (event?: React.MouseEvent) => {
    trackEvent('Button', 'click', buttonName, undefined, metadata);
  };
}

/**
 * Track modal open/close
 *
 * @param modalName - Name of the modal
 * @param isOpen - Whether the modal is open
 *
 * @example
 * ```tsx
 * function MyModal({ open }) {
 *   useModalTracking('settings_modal', open);
 *
 *   return <Modal open={open}>...</Modal>;
 * }
 * ```
 */
export function useModalTracking(modalName: string, isOpen: boolean): void {
  const previousOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !previousOpenRef.current) {
      trackEvent('Modal', 'open', modalName);
    } else if (!isOpen && previousOpenRef.current) {
      trackEvent('Modal', 'close', modalName);
    }
    previousOpenRef.current = isOpen;
  }, [isOpen, modalName]);
}

/**
 * Track errors in component
 *
 * @returns Error tracking function
 *
 * @example
 * ```tsx
 * function DataComponent() {
 *   const trackError = useErrorTracking();
 *
 *   const { data, error } = useQuery({
 *     queryKey: ['data'],
 *     queryFn: fetchData,
 *     onError: (error) => {
 *       trackError('API Error', error.message);
 *     },
 *   });
 * }
 * ```
 */
export function useErrorTracking() {
  return (category: string, errorMessage: string, fatal: boolean = false) => {
    trackEvent('Error', category, errorMessage, fatal ? 1 : 0);
  };
}
