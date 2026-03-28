/**
 * Error Monitoring Service
 *
 * Comprehensive error tracking and monitoring using Sentry
 *
 * Features:
 * - Automatic error capturing
 * - Source map support
 * - Performance monitoring
 * - User context tracking
 * - Custom error tags and breadcrumbs
 * - Environment-based configuration
 *
 * @example
 * ```tsx
 * // Initialize in App.tsx
 * import { initErrorMonitoring } from '@/lib/errorMonitoring';
 *
 * function App() {
 *   useEffect(() => {
 *     initErrorMonitoring();
 *   }, []);
 * }
 *
 * // Capture errors manually
 * import { captureError } from '@/lib/errorMonitoring';
 *
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureError(error, { operation: 'riskyOperation' });
 * }
 * ```
 */

import * as Sentry from '@sentry/react';
import { type User } from '@sentry/react';
import { logger } from '@/lib/logger';

/**
 * Error monitoring configuration
 */
export interface ErrorMonitoringConfig {
  /** Sentry DSN (Data Source Name) */
  dsn?: string | undefined;
  /** Environment name (production, staging, development) */
  environment?: string | undefined;
  /** Application release version */
  release?: string | undefined;
  /** Sample rate for performance monitoring (0.0 to 1.0) */
  tracesSampleRate?: number | undefined;
  /** Enable in development */
  enableInDev?: boolean | undefined;
  /** Enable debug mode */
  debug?: boolean | undefined;
}

/**
 * Error context for additional debugging information
 */
export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  Debug: 'debug',
  Error: 'error',
  Fatal: 'fatal',
  Info: 'info',
  Warning: 'warning',
} as const;
export type ErrorSeverity = (typeof ErrorSeverity)[keyof typeof ErrorSeverity];

let isInitialized = false;
let config: ErrorMonitoringConfig = {};

/**
 * Initialize error monitoring
 *
 * Should be called once on application startup
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   initErrorMonitoring({
 *     dsn: import.meta.env.VITE_SENTRY_DSN,
 *     environment: import.meta.env.MODE,
 *     release: import.meta.env.VITE_APP_VERSION,
 *     tracesSampleRate: 0.1,
 *   });
 * }, []);
 * ```
 */
export const initErrorMonitoring = (options: ErrorMonitoringConfig = {}): void => {
  if (isInitialized) {
    logger.warn('[Error Monitoring] Already initialized');
    return;
  }

  config = {
    debug: import.meta.env.DEV === true,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    enableInDev: false,
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    tracesSampleRate: 0.1, // Sample 10% of transactions
    ...options,
  };

  // Don't initialize in development unless explicitly enabled
  if (import.meta.env.DEV && !config.enableInDev) {
    logger.debug('[Error Monitoring] Disabled in development mode');
    return;
  }

  // Don't initialize without DSN
  if (!config.dsn) {
    logger.warn('[Error Monitoring] No DSN provided, error monitoring disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      ...(config.environment != null && { environment: config.environment }),
      ...(config.release != null && { release: config.release }),

      // Performance trace sample rate
      ...(config.tracesSampleRate != null && { tracesSampleRate: config.tracesSampleRate }),

      // Debug mode
      ...(config.debug != null && { debug: config.debug }),

      // Before send hook for filtering/modifying events
      beforeSend(event, _hint) {
        // Filter out localhost errors in production
        if (event.request?.url?.includes('localhost') && config.environment === 'production') {
          return null;
        }

        // Add custom logic here
        return event;
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',

        // Network errors
        'Network request failed',
        'NetworkError',
        'Failed to fetch',

        // Common noise
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
      ],

      // Don't send PII
      sendDefaultPii: false,
    });

    isInitialized = true;

    if (config.debug) {
      logger.debug('[Error Monitoring] Sentry initialized:', {
        dsn: config.dsn,
        environment: config.environment,
        release: config.release,
      });
    }
  } catch (error) {
    logger.error('[Error Monitoring] Failed to initialize Sentry:', error);
  }
};

/**
 * Capture an error
 *
 * @param error - Error object or message
 * @param context - Additional context for debugging
 * @param severity - Error severity level
 *
 * @example
 * ```tsx
 * try {
 *   await sendTransaction();
 * } catch (error) {
 *   captureError(error, {
 *     transaction: tx,
 *     amount: 100,
 *     asset: 'DCC',
 *   });
 * }
 * ```
 */
export const captureError = (
  error: Error | string,
  context?: ErrorContext,
  severity: ErrorSeverity = ErrorSeverity.Error,
): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    // Log to console in development
    if (import.meta.env.DEV) {
      logger.error('[Error Monitoring]', error, context);
    }
    return;
  }

  try {
    Sentry.captureException(error, {
      level: severity,
      ...(context != null && { extra: context }),
    });

    if (config.debug) {
      logger.debug('[Error Monitoring] Error captured:', { context, error, severity });
    }
  } catch (e) {
    logger.error('[Error Monitoring] Failed to capture error:', e);
  }
};

/**
 * Capture a message
 *
 * @param message - Message to capture
 * @param severity - Message severity
 * @param context - Additional context
 *
 * @example
 * ```tsx
 * captureMessage('User completed onboarding', ErrorSeverity.Info, {
 *   userId: user.id,
 *   duration: 120000,
 * });
 * ```
 */
export const captureMessage = (
  message: string,
  severity: ErrorSeverity = ErrorSeverity.Info,
  context?: ErrorContext,
): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    if (import.meta.env.DEV) {
      logger.debug('[Error Monitoring]', message, context);
    }
    return;
  }

  try {
    Sentry.captureMessage(message, {
      level: severity,
      ...(context != null && { extra: context }),
    });

    if (config.debug) {
      logger.debug('[Error Monitoring] Message captured:', { context, message, severity });
    }
  } catch (e) {
    logger.error('[Error Monitoring] Failed to capture message:', e);
  }
};

/**
 * Set user context
 *
 * @param user - User information
 *
 * @example
 * ```tsx
 * const { user } = useAuth();
 *
 * useEffect(() => {
 *   if (user) {
 *     setUser({
 *       id: user.address,
 *       username: user.alias,
 *     });
 *   }
 * }, [user]);
 * ```
 */
export const setUser = (user: Partial<User> | null): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    return;
  }

  try {
    Sentry.setUser(user);

    if (config.debug) {
      logger.debug('[Error Monitoring] User set:', user);
    }
  } catch (e) {
    logger.error('[Error Monitoring] Failed to set user:', e);
  }
};

/**
 * Set custom tags
 *
 * @param tags - Custom tags
 *
 * @example
 * ```tsx
 * setTags({
 *   feature: 'dex',
 *   network: 'mainnet',
 *   version: '1.0.0',
 * });
 * ```
 */
export const setTags = (tags: Record<string, string>): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    return;
  }

  try {
    Sentry.setTags(tags);

    if (config.debug) {
      logger.debug('[Error Monitoring] Tags set:', tags);
    }
  } catch (e) {
    logger.error('[Error Monitoring] Failed to set tags:', e);
  }
};

/**
 * Set custom context
 *
 * @param name - Context name
 * @param context - Context data
 *
 * @example
 * ```tsx
 * setContext('transaction', {
 *   id: tx.id,
 *   amount: tx.amount,
 *   asset: tx.asset,
 *   fee: tx.fee,
 * });
 * ```
 */
export const setContext = (name: string, context: ErrorContext): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    return;
  }

  try {
    Sentry.setContext(name, context);

    if (config.debug) {
      logger.debug('[Error Monitoring] Context set:', { context, name });
    }
  } catch (e) {
    logger.error('[Error Monitoring] Failed to set context:', e);
  }
};

/**
 * Add breadcrumb
 *
 * @param message - Breadcrumb message
 * @param category - Breadcrumb category
 * @param level - Breadcrumb level
 * @param data - Additional data
 *
 * @example
 * ```tsx
 * addBreadcrumb(
 *   'User clicked send button',
 *   'user-action',
 *   ErrorSeverity.Info,
 *   { amount: 100, asset: 'DCC' }
 * );
 * ```
 */
export const addBreadcrumb = (
  message: string,
  category?: string,
  level: ErrorSeverity = ErrorSeverity.Info,
  data?: ErrorContext,
): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    return;
  }

  try {
    Sentry.addBreadcrumb({
      message,
      ...(category != null && { category }),
      data: data as Record<string, unknown>,
      level,
    });

    if (config.debug) {
      logger.debug('[Error Monitoring] Breadcrumb added:', { category, data, level, message });
    }
  } catch (e) {
    logger.error('[Error Monitoring] Failed to add breadcrumb:', e);
  }
};

/**
 * Clear user context
 *
 * Should be called on logout
 *
 * @example
 * ```tsx
 * const handleLogout = () => {
 *   clearUser();
 *   // ... logout logic ...
 * };
 * ```
 */
export const clearUser = (): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    return;
  }

  try {
    Sentry.setUser(null);

    if (config.debug) {
      logger.debug('[Error Monitoring] User cleared');
    }
  } catch (e) {
    logger.error('[Error Monitoring] Failed to clear user:', e);
  }
};

/**
 * Wrap ErrorBoundary with Sentry
 *
 * @example
 * ```tsx
 * import { ErrorBoundary } from '@/lib/errorMonitoring';
 *
 * function App() {
 *   return (
 *     <ErrorBoundary fallback={<ErrorFallback />}>
 *       <YourApp />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 */
export const ErrorBoundary = Sentry.ErrorBoundary;

/**
 * Profiler component for performance monitoring
 *
 * @example
 * ```tsx
 * import { Profiler } from '@/lib/errorMonitoring';
 *
 * function Dashboard() {
 *   return (
 *     <Profiler name="Dashboard">
 *       <YourContent />
 *     </Profiler>
 *   );
 * }
 * ```
 */
export const Profiler = Sentry.Profiler;

/**
 * Start a transaction for performance monitoring
 *
 * Note: This feature requires additional Sentry configuration
 *
 * @param name - Transaction name
 * @param operation - Operation type
 * @returns Transaction ID for tracking
 *
 * @example
 * ```tsx
 * const txId = startTransaction('fetchTransactions', 'http');
 *
 * try {
 *   const data = await fetch('/api/transactions');
 *   // Transaction succeeded
 * } catch (error) {
 *   // Transaction failed
 *   throw error;
 * }
 * ```
 */
export const startTransaction = (name: string, operation: string): string => {
  const txId = `${operation}-${name}-${Date.now()}`;

  if (config.debug) {
    logger.debug('[Error Monitoring] Transaction started:', { name, operation, txId });
  }

  addBreadcrumb(`Transaction started: ${name}`, 'transaction', ErrorSeverity.Info, { operation });

  return txId;
};

/**
 * Predefined error tracking functions
 */
export const errorMonitoring = {
  // API errors
  apiError: (endpoint: string, status: number, message: string) =>
    captureError(
      new Error(`API Error: ${endpoint}`),
      { endpoint, message, status },
      ErrorSeverity.Error,
    ),

  // Authentication errors
  authError: (error: Error) => captureError(error, { type: 'authentication' }, ErrorSeverity.Error),

  // DEX errors
  dexError: (operation: string, error: Error) =>
    captureError(error, { operation, type: 'dex' }, ErrorSeverity.Error),

  // Network errors
  networkError: (error: Error) => captureError(error, { type: 'network' }, ErrorSeverity.Warning),

  // Transaction errors
  transactionFailed: (txId: string, reason: string) =>
    captureError(new Error('Transaction Failed'), { reason, txId }, ErrorSeverity.Error),

  // Validation errors
  validationError: (field: string, value: unknown, rule: string) =>
    captureMessage('Validation Error', ErrorSeverity.Warning, { field, rule, value }),
};

export default {
  addBreadcrumb,
  captureError,
  captureMessage,
  clearUser,
  ErrorBoundary,
  errorMonitoring,
  initErrorMonitoring,
  Profiler,
  setContext,
  setTags,
  setUser,
  startTransaction,
};
