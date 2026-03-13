/**
 * Analytics Tracking Service
 *
 * Comprehensive analytics implementation supporting:
 * - Google Analytics 4 (GA4)
 * - Amplitude
 * - Custom event tracking
 * - Page view tracking
 * - User identification
 * - E-commerce tracking
 *
 * @example
 * ```tsx
 * // Initialize in App.tsx
 * import { initAnalytics } from '@/lib/analytics';
 *
 * function App() {
 *   useEffect(() => {
 *     initAnalytics();
 *   }, []);
 * }
 *
 * // Track events in components
 * import { trackEvent, trackPageView } from '@/lib/analytics';
 *
 * function SendButton() {
 *   const handleSend = () => {
 *     trackEvent('Transaction', 'send', 'DCC', 100);
 *   };
 *
 *   return <Button onClick={handleSend}>Send</Button>;
 * }
 * ```
 */

import ReactGA from 'react-ga4';
import { logger } from '@/lib/logger';

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /** Google Analytics 4 Measurement ID */
  gaId?: string;
  /** Amplitude API Key */
  amplitudeKey?: string;
  /** Enable debug mode */
  debug?: boolean;
  /** Enable in development */
  enableInDev?: boolean;
  /** User ID for tracking */
  userId?: string;
}

/**
 * Event parameters
 */
export interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * E-commerce item
 */
export interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
}

/**
 * User properties
 */
export interface UserProperties {
  [key: string]: string | number | boolean;
}

let isInitialized = false;
let config: AnalyticsConfig = {};

/**
 * Initialize analytics services
 *
 * Should be called once on application startup
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   initAnalytics({
 *     gaId: import.meta.env.VITE_GA_MEASUREMENT_ID,
 *     amplitudeKey: import.meta.env.VITE_AMPLITUDE_KEY,
 *     debug: import.meta.env.DEV,
 *   });
 * }, []);
 * ```
 */
export const initAnalytics = (options: AnalyticsConfig = {}): void => {
  if (isInitialized) {
    logger.warn('[Analytics] Already initialized');
    return;
  }

  config = {
    ...(import.meta.env.VITE_GA_MEASUREMENT_ID && { gaId: import.meta.env.VITE_GA_MEASUREMENT_ID }),
    ...(import.meta.env.VITE_AMPLITUDE_KEY && { amplitudeKey: import.meta.env.VITE_AMPLITUDE_KEY }),
    debug: import.meta.env.DEV === true,
    enableInDev: false,
    ...options,
  };

  // Don't track in development unless explicitly enabled
  if (import.meta.env.DEV && !config.enableInDev) {
    logger.debug('[Analytics] Disabled in development mode');
    return;
  }

  // Initialize Google Analytics 4
  if (config.gaId) {
    try {
      ReactGA.initialize(config.gaId, {
        gaOptions: {
          debug_mode: config.debug,
        },
      });

      if (config.debug) {
        logger.debug('[Analytics] Google Analytics initialized:', config.gaId);
      }
    } catch (error) {
      logger.error('[Analytics] Failed to initialize Google Analytics:', error);
    }
  }

  // Initialize Amplitude
  if (config.amplitudeKey && typeof window !== 'undefined') {
    try {
      if (window.amplitudeInit) {
        window.amplitudeInit(config.amplitudeKey, {
          includeUtm: true,
          includeReferrer: true,
          saveEvents: true,
        });

        if (config.debug) {
          logger.debug('[Analytics] Amplitude initialized:', config.amplitudeKey);
        }
      }
    } catch (error) {
      logger.error('[Analytics] Failed to initialize Amplitude:', error);
    }
  }

  // Set user ID if provided
  if (config.userId) {
    setUserId(config.userId);
  }

  isInitialized = true;
};

/**
 * Track page view
 *
 * @param path - Page path (e.g., '/wallet/portfolio')
 * @param title - Optional page title
 *
 * @example
 * ```tsx
 * // In route component
 * useEffect(() => {
 *   trackPageView(location.pathname);
 * }, [location]);
 *
 * // With title
 * trackPageView('/wallet', 'Wallet Overview');
 * ```
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    return;
  }

  try {
    // Google Analytics
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });

    // Amplitude
    if (typeof window !== 'undefined' && window.amplitudePushEvent) {
      window.amplitudePushEvent('Page View', {
        path,
        title: title || document.title,
        url: window.location.href,
      });
    }

    if (config.debug) {
      logger.debug('[Analytics] Page view tracked:', { path, title });
    }
  } catch (error) {
    logger.error('[Analytics] Failed to track page view:', error);
  }
};

/**
 * Track custom event
 *
 * @param category - Event category (e.g., 'Transaction', 'User', 'DEX')
 * @param action - Event action (e.g., 'send', 'receive', 'trade')
 * @param label - Optional label for additional context
 * @param value - Optional numeric value
 * @param params - Additional event parameters
 *
 * @example
 * ```tsx
 * // Simple event
 * trackEvent('Button', 'click', 'Send Transaction');
 *
 * // With value
 * trackEvent('Transaction', 'send', 'DCC', 100);
 *
 * // With custom parameters
 * trackEvent('DEX', 'trade', undefined, undefined, {
 *   pair: 'DCC/USDT',
 *   amount: 1000,
 *   price: 0.5,
 * });
 * ```
 */
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number,
  params?: EventParams,
): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    return;
  }

  try {
    // Google Analytics
    ReactGA.event({
      category,
      action,
      ...(label != null && { label }),
      ...(value != null && { value }),
      ...params,
    });

    // Amplitude
    if (typeof window !== 'undefined' && window.amplitudePushEvent) {
      window.amplitudePushEvent(`${category}_${action}`, {
        category,
        action,
        label,
        value,
        ...params,
      });
    }

    if (config.debug) {
      logger.debug('[Analytics] Event tracked:', { category, action, label, value, params });
    }
  } catch (error) {
    logger.error('[Analytics] Failed to track event:', error);
  }
};

/**
 * Set user ID
 *
 * @param userId - Unique user identifier (wallet address or user ID)
 *
 * @example
 * ```tsx
 * // When user logs in
 * const { user } = useAuth();
 *
 * useEffect(() => {
 *   if (user) {
 *     setUserId(user.address);
 *   }
 * }, [user]);
 * ```
 */
export const setUserId = (userId: string): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    return;
  }

  try {
    // Google Analytics
    ReactGA.set({ userId });

    // Amplitude
    if (typeof window !== 'undefined' && window.amplitude?.getInstance) {
      window.amplitude.getInstance().setUserId(userId);
    }

    if (config.debug) {
      logger.debug('[Analytics] User ID set:', userId);
    }
  } catch (error) {
    logger.error('[Analytics] Failed to set user ID:', error);
  }
};

/**
 * Set user properties
 *
 * @param properties - User properties to set
 *
 * @example
 * ```tsx
 * setUserProperties({
 *   plan: 'premium',
 *   language: 'en',
 *   theme: 'dark',
 * });
 * ```
 */
export const setUserProperties = (properties: UserProperties): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    return;
  }

  try {
    // Google Analytics
    ReactGA.set(properties);

    // Amplitude
    if (typeof window !== 'undefined' && window.amplitude?.getInstance) {
      window.amplitude.getInstance().setUserProperties(properties);
    }

    if (config.debug) {
      logger.debug('[Analytics] User properties set:', properties);
    }
  } catch (error) {
    logger.error('[Analytics] Failed to set user properties:', error);
  }
};

/**
 * Track transaction
 *
 * @param transactionId - Unique transaction ID
 * @param value - Transaction value
 * @param currency - Currency code (e.g., 'DCC', 'USDT')
 * @param params - Additional transaction parameters
 *
 * @example
 * ```tsx
 * trackTransaction('tx-123', 100, 'DCC', {
 *   type: 'send',
 *   recipient: '3P...',
 *   fee: 0.001,
 * });
 * ```
 */
export const trackTransaction = (
  transactionId: string,
  value: number,
  currency: string,
  params?: EventParams,
): void => {
  trackEvent('Transaction', 'complete', currency, value, {
    transaction_id: transactionId,
    currency,
    ...params,
  });
};

/**
 * Track purchase (e-commerce)
 *
 * @param transactionId - Unique transaction ID
 * @param value - Purchase value
 * @param currency - Currency code
 * @param items - Purchased items
 *
 * @example
 * ```tsx
 * trackPurchase('tx-123', 100, 'DCC', [
 *   {
 *     item_id: 'asset-1',
 *     item_name: 'Premium Asset',
 *     price: 100,
 *     quantity: 1,
 *   },
 * ]);
 * ```
 */
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string,
  items: EcommerceItem[],
): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    return;
  }

  try {
    ReactGA.event('purchase', {
      transaction_id: transactionId,
      value,
      currency,
      items,
    });

    if (config.debug) {
      logger.debug('[Analytics] Purchase tracked:', { transactionId, value, currency, items });
    }
  } catch (error) {
    logger.error('[Analytics] Failed to track purchase:', error);
  }
};

/**
 * Track timing
 *
 * @param category - Timing category
 * @param variable - Timing variable
 * @param value - Time value in milliseconds
 * @param label - Optional label
 *
 * @example
 * ```tsx
 * // Track API response time
 * const start = Date.now();
 * await fetchData();
 * trackTiming('API', 'fetch_transactions', Date.now() - start);
 *
 * // Track page load time
 * trackTiming('Page', 'load', performance.timing.loadEventEnd - performance.timing.navigationStart);
 * ```
 */
export const trackTiming = (
  category: string,
  variable: string,
  value: number,
  label?: string,
): void => {
  trackEvent('Timing', category, label, value, {
    timing_category: category,
    timing_variable: variable,
  });
};

/**
 * Track exception
 *
 * @param description - Error description
 * @param fatal - Whether the error is fatal
 *
 * @example
 * ```tsx
 * try {
 *   await sendTransaction();
 * } catch (error) {
 *   trackException(error.message, false);
 * }
 * ```
 */
export const trackException = (description: string, fatal: boolean = false): void => {
  if (!isInitialized || (import.meta.env.DEV && !config.enableInDev)) {
    return;
  }

  try {
    ReactGA.event('exception', {
      description,
      fatal,
    });

    if (config.debug) {
      logger.debug('[Analytics] Exception tracked:', { description, fatal });
    }
  } catch (error) {
    logger.error('[Analytics] Failed to track exception:', error);
  }
};

/**
 * Clear user data
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
    // Clear Google Analytics user ID
    ReactGA.set({ userId: null });

    // Clear Amplitude user ID
    if (typeof window !== 'undefined' && window.amplitude?.getInstance) {
      window.amplitude.getInstance().setUserId(null);
      window.amplitude.getInstance().regenerateDeviceId();
    }

    if (config.debug) {
      logger.debug('[Analytics] User data cleared');
    }
  } catch (error) {
    logger.error('[Analytics] Failed to clear user data:', error);
  }
};

/**
 * Predefined tracking functions for common events
 */

export const analytics = {
  // Wallet events
  walletCreated: () => trackEvent('Wallet', 'created'),
  walletImported: () => trackEvent('Wallet', 'imported'),
  walletBackedUp: () => trackEvent('Wallet', 'backed_up'),

  // Transaction events
  transactionSent: (amount: number, asset: string) =>
    trackEvent('Transaction', 'send', asset, amount),
  transactionReceived: (amount: number, asset: string) =>
    trackEvent('Transaction', 'receive', asset, amount),

  // DEX events
  orderPlaced: (pair: string, side: 'buy' | 'sell', amount: number) =>
    trackEvent('DEX', 'order_placed', pair, amount, { side }),
  orderCancelled: (pair: string) => trackEvent('DEX', 'order_cancelled', pair),
  tradeExecuted: (pair: string, amount: number, price: number) =>
    trackEvent('DEX', 'trade_executed', pair, amount, { price }),

  // Leasing events
  leasingStarted: (amount: number) => trackEvent('Leasing', 'started', undefined, amount),
  leasingCancelled: () => trackEvent('Leasing', 'cancelled'),

  // Settings events
  themeChanged: (theme: string) => trackEvent('Settings', 'theme_changed', theme),
  languageChanged: (language: string) => trackEvent('Settings', 'language_changed', language),

  // Feature usage
  featureUsed: (feature: string) => trackEvent('Feature', 'used', feature),

  // Search events
  searchPerformed: (query: string, resultsCount: number) =>
    trackEvent('Search', 'performed', query, resultsCount),

  // Help events
  helpViewed: (topic: string) => trackEvent('Help', 'viewed', topic),
  supportContacted: (method: string) => trackEvent('Support', 'contacted', method),
};

// Type declarations for window.amplitude and window.amplitudeInit
declare global {
  interface Window {
    amplitude?: {
      getInstance: () => {
        init: (apiKey: string, userId: string | null, options: Record<string, unknown>) => void;
        logEvent: (name: string, params?: Record<string, unknown>) => void;
        setUserId: (userId: string | null) => void;
        setUserProperties: (properties: Record<string, unknown>) => void;
        regenerateDeviceId: () => void;
      };
    };
    amplitudeInit?: (apiKey: string, options: Record<string, unknown>) => void;
    amplitudePushEvent?: (name: string, params?: Record<string, unknown>) => void;
  }
}

export default {
  initAnalytics,
  trackPageView,
  trackEvent,
  setUserId,
  setUserProperties,
  trackTransaction,
  trackPurchase,
  trackTiming,
  trackException,
  clearUser,
  analytics,
};
