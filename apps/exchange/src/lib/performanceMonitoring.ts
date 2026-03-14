/**
 * Performance Monitoring Service
 *
 * Comprehensive performance tracking using Web Vitals and custom metrics
 *
 * Features:
 * - Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP)
 * - Custom performance marks and measures
 * - API response time tracking
 * - Component render time tracking
 * - Resource loading metrics
 * - Navigation timing
 *
 * @example
 * ```tsx
 * // Initialize in App.tsx
 * import { initPerformanceMonitoring } from '@/lib/performanceMonitoring';
 *
 * function App() {
 *   useEffect(() => {
 *     initPerformanceMonitoring();
 *   }, []);
 * }
 *
 * // Track custom performance
 * import { markPerformance, measurePerformance } from '@/lib/performanceMonitoring';
 *
 * markPerformance('data-fetch-start');
 * await fetchData();
 * measurePerformance('data-fetch', 'data-fetch-start');
 * ```
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';
import { trackEvent } from '@/lib/analytics';
import { captureMessage, ErrorSeverity } from '@/lib/errorMonitoring';

/**
 * Performance monitoring configuration
 */
export interface PerformanceMonitoringConfig {
  /** Enable Web Vitals tracking */
  enableWebVitals?: boolean;
  /** Enable resource timing tracking */
  enableResourceTiming?: boolean;
  /** Enable navigation timing tracking */
  enableNavigationTiming?: boolean;
  /** Enable in development */
  enableInDev?: boolean;
  /** Enable debug mode */
  debug?: boolean;
  /** Report to analytics */
  reportToAnalytics?: boolean;
  /** Report to error monitoring */
  reportToErrorMonitoring?: boolean;
}

/**
 * Performance metric thresholds (based on Google's Web Vitals)
 */
const THRESHOLDS = {
  // Largest Contentful Paint (ms)
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  // Cumulative Layout Shift (score)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // First Contentful Paint (ms)
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  // Time to First Byte (ms)
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  // Interaction to Next Paint (ms) - Replaces FID in web-vitals v3
  INP: {
    good: 200,
    needsImprovement: 500,
  },
};

let isInitialized = false;
let config: PerformanceMonitoringConfig = {};

/**
 * Send metric to analytics and error monitoring
 */
const reportMetric = (metric: Metric): void => {
  const { name, value, rating, delta, id } = metric;

  // Round value to 2 decimal places
  const roundedValue = Math.round(value * 100) / 100;

  // Log to console in debug mode
  if (config.debug) {
    console.log('[Performance]', {
      name,
      value: roundedValue,
      rating,
      delta,
      id,
    });
  }

  // Send to analytics
  if (config.reportToAnalytics) {
    trackEvent('Web Vitals', name, rating, roundedValue, {
      metric_id: id,
      delta: Math.round(delta * 100) / 100,
    });
  }

  // Send to error monitoring if poor
  if (config.reportToErrorMonitoring && rating === 'poor') {
    captureMessage(`Poor ${name} performance`, ErrorSeverity.Warning, {
      metric: name,
      value: roundedValue,
      rating,
      threshold: THRESHOLDS[name as keyof typeof THRESHOLDS]?.needsImprovement,
    });
  }
};

/**
 * Initialize performance monitoring
 *
 * Tracks Core Web Vitals and custom performance metrics
 *
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   initPerformanceMonitoring({
 *     enableWebVitals: true,
 *     enableResourceTiming: true,
 *     reportToAnalytics: true,
 *     debug: import.meta.env.DEV,
 *   });
 * }, []);
 * ```
 */
export const initPerformanceMonitoring = (options: PerformanceMonitoringConfig = {}): void => {
  if (isInitialized) {
    console.warn('[Performance] Already initialized');
    return;
  }

  config = {
    enableWebVitals: true,
    enableResourceTiming: true,
    enableNavigationTiming: true,
    enableInDev: false,
    debug: import.meta.env.DEV === true,
    reportToAnalytics: true,
    reportToErrorMonitoring: true,
    ...options,
  };

  // Don't track in development unless explicitly enabled
  if (import.meta.env.DEV && !config.enableInDev) {
    console.log('[Performance] Disabled in development mode');
    return;
  }

  // Track Web Vitals
  if (config.enableWebVitals) {
    try {
      // Largest Contentful Paint
      onLCP(reportMetric);

      // Cumulative Layout Shift
      onCLS(reportMetric);

      // First Contentful Paint
      onFCP(reportMetric);

      // Time to First Byte
      onTTFB(reportMetric);

      // Interaction to Next Paint (replaces FID in web-vitals v3)
      onINP(reportMetric);

      if (config.debug) {
        console.log('[Performance] Web Vitals tracking initialized');
      }
    } catch (error) {
      console.error('[Performance] Failed to initialize Web Vitals:', error);
    }
  }

  // Track navigation timing
  if (config.enableNavigationTiming) {
    try {
      window.addEventListener('load', () => {
        setTimeout(() => {
          trackNavigationTiming();
        }, 0);
      });

      if (config.debug) {
        console.log('[Performance] Navigation timing tracking initialized');
      }
    } catch (error) {
      console.error('[Performance] Failed to initialize navigation timing:', error);
    }
  }

  // Track resource timing
  if (config.enableResourceTiming) {
    try {
      window.addEventListener('load', () => {
        setTimeout(() => {
          trackResourceTiming();
        }, 0);
      });

      if (config.debug) {
        console.log('[Performance] Resource timing tracking initialized');
      }
    } catch (error) {
      console.error('[Performance] Failed to initialize resource timing:', error);
    }
  }

  isInitialized = true;
};

/**
 * Track navigation timing metrics
 */
const trackNavigationTiming = (): void => {
  if (!window.performance || !window.performance.timing) {
    return;
  }

  const timing = window.performance.timing;

  // Calculate metrics
  const metrics = {
    // DNS lookup time
    dns: timing.domainLookupEnd - timing.domainLookupStart,

    // TCP connection time
    tcp: timing.connectEnd - timing.connectStart,

    // Request time
    request: timing.responseStart - timing.requestStart,

    // Response time
    response: timing.responseEnd - timing.responseStart,

    // DOM processing time
    domProcessing: timing.domComplete - timing.domLoading,

    // DOM content loaded
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,

    // Total load time
    loadComplete: timing.loadEventEnd - timing.navigationStart,
  };

  if (config.debug) {
    console.log('[Performance] Navigation timing:', metrics);
  }

  if (config.reportToAnalytics) {
    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        trackEvent('Navigation Timing', name, undefined, value);
      }
    });
  }
};

/**
 * Track resource timing metrics
 */
const trackResourceTiming = (): void => {
  if (!window.performance || !window.performance.getEntriesByType) {
    return;
  }

  const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  // Group resources by type
  const resourcesByType: Record<string, number[]> = {};

  resources.forEach((resource) => {
    const type = resource.initiatorType || 'other';

    if (!resourcesByType[type]) {
      resourcesByType[type] = [];
    }

    resourcesByType[type].push(resource.duration);
  });

  // Calculate averages and totals
  const stats: Record<string, { count: number; avgDuration: number; totalDuration: number }> = {};

  Object.entries(resourcesByType).forEach(([type, durations]) => {
    const count = durations.length;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = totalDuration / count;

    stats[type] = {
      count,
      avgDuration: Math.round(avgDuration * 100) / 100,
      totalDuration: Math.round(totalDuration * 100) / 100,
    };
  });

  if (config.debug) {
    console.log('[Performance] Resource timing:', stats);
  }

  if (config.reportToAnalytics) {
    Object.entries(stats).forEach(([type, { count, avgDuration, totalDuration }]) => {
      trackEvent('Resource Timing', type, undefined, avgDuration, {
        count,
        totalDuration,
      });
    });
  }
};

/**
 * Create a performance mark
 *
 * @param name - Mark name
 *
 * @example
 * ```tsx
 * markPerformance('data-fetch-start');
 * await fetchData();
 * measurePerformance('data-fetch', 'data-fetch-start');
 * ```
 */
export const markPerformance = (name: string): void => {
  if (!window.performance || !window.performance.mark) {
    return;
  }

  try {
    window.performance.mark(name);

    if (config.debug) {
      console.log('[Performance] Mark created:', name);
    }
  } catch (error) {
    console.error('[Performance] Failed to create mark:', error);
  }
};

/**
 * Measure performance between marks
 *
 * @param name - Measure name
 * @param startMark - Start mark name
 * @param endMark - End mark name (optional, defaults to now)
 * @returns Measured duration in milliseconds
 *
 * @example
 * ```tsx
 * markPerformance('api-start');
 * const data = await api.fetch();
 * const duration = measurePerformance('api-call', 'api-start');
 * console.log(`API took ${duration}ms`);
 * ```
 */
export const measurePerformance = (
  name: string,
  startMark: string,
  endMark?: string
): number | null => {
  if (!window.performance || !window.performance.measure) {
    return null;
  }

  try {
    const measure = window.performance.measure(name, startMark, endMark);
    const duration = Math.round(measure.duration * 100) / 100;

    if (config.debug) {
      console.log('[Performance] Measurement:', { name, duration });
    }

    if (config.reportToAnalytics) {
      trackEvent('Performance Measure', name, undefined, duration);
    }

    return duration;
  } catch (error) {
    console.error('[Performance] Failed to measure performance:', error);
    return null;
  }
};

/**
 * Clear performance marks and measures
 *
 * @param name - Mark/measure name to clear (optional, clears all if not provided)
 *
 * @example
 * ```tsx
 * clearPerformance('api-start');
 * clearPerformance(); // Clear all
 * ```
 */
export const clearPerformance = (name?: string): void => {
  if (!window.performance) {
    return;
  }

  try {
    if (name) {
      window.performance.clearMarks(name);
      window.performance.clearMeasures(name);
    } else {
      window.performance.clearMarks();
      window.performance.clearMeasures();
    }

    if (config.debug) {
      console.log('[Performance] Cleared:', name || 'all');
    }
  } catch (error) {
    console.error('[Performance] Failed to clear performance:', error);
  }
};

/**
 * Get current memory usage (if available)
 *
 * @returns Memory usage in MB or null if not available
 *
 * @example
 * ```tsx
 * const memory = getMemoryUsage();
 * console.log(`Memory: ${memory?.usedJSHeapSize}MB`);
 * ```
 */
export const getMemoryUsage = (): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null => {
  //@ts-expect-error - memory API is not standard
  if (!window.performance || !window.performance.memory) {
    return null;
  }

  //@ts-expect-error - memory API is not standard
  const memory = window.performance.memory;

  return {
    usedJSHeapSize: Math.round((memory.usedJSHeapSize / 1024 / 1024) * 100) / 100,
    totalJSHeapSize: Math.round((memory.totalJSHeapSize / 1024 / 1024) * 100) / 100,
    jsHeapSizeLimit: Math.round((memory.jsHeapSizeLimit / 1024 / 1024) * 100) / 100,
  };
};

/**
 * Track long tasks (> 50ms)
 *
 * Note: Requires PerformanceObserver support
 *
 * @example
 * ```tsx
 * trackLongTasks();
 * ```
 */
export const trackLongTasks = (): void => {
  if (!window.PerformanceObserver) {
    console.warn('[Performance] PerformanceObserver not supported');
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = Math.round(entry.duration * 100) / 100;

        if (config.debug) {
          console.warn('[Performance] Long task detected:', {
            name: entry.name,
            duration,
            startTime: entry.startTime,
          });
        }

        if (config.reportToAnalytics) {
          trackEvent('Long Task', entry.name, undefined, duration);
        }

        if (config.reportToErrorMonitoring && duration > 100) {
          captureMessage('Long task detected', ErrorSeverity.Warning, {
            task: entry.name,
            duration,
            startTime: entry.startTime,
          });
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    if (config.debug) {
      console.log('[Performance] Long task tracking initialized');
    }
  } catch (error) {
    console.error('[Performance] Failed to track long tasks:', error);
  }
};

/**
 * Predefined performance tracking functions
 */
export const performance = {
  // API performance
  apiCall: (endpoint: string, duration: number) =>
    trackEvent('API Performance', endpoint, undefined, duration),

  // Component render performance
  componentRender: (component: string, duration: number) =>
    trackEvent('Component Performance', component, undefined, duration),

  // Route change performance
  routeChange: (route: string, duration: number) =>
    trackEvent('Route Performance', route, undefined, duration),

  // Data loading performance
  dataLoad: (type: string, duration: number) =>
    trackEvent('Data Load Performance', type, undefined, duration),
};

export default {
  initPerformanceMonitoring,
  markPerformance,
  measurePerformance,
  clearPerformance,
  getMemoryUsage,
  trackLongTasks,
  performance,
};
