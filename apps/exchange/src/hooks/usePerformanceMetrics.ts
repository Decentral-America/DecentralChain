/**
 * Performance Metrics Dashboard Hook
 *
 * Hook to display current performance metrics in dev mode
 */

import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { getMemoryUsage } from '@/lib/performanceMonitoring';

export interface PerformanceMetrics {
  // Web Vitals
  lcp: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  inp: number | null;

  // Navigation Timing
  loadTime: number | null;
  domContentLoaded: number | null;
  domProcessing: number | null;

  // Resource Timing
  scriptCount: number;
  scriptDuration: number;
  stylesheetCount: number;
  stylesheetDuration: number;
  imageCount: number;
  imageDuration: number;

  // Memory
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;

  // Custom
  componentRenderCount: number;
  apiCallCount: number;
  routeChangeCount: number;
}

/**
 * Hook to get current performance metrics
 *
 * Returns real-time performance metrics including Web Vitals,
 * navigation timing, resource timing, and memory usage.
 *
 * @param options - Configuration options
 * @returns Performance metrics and control functions
 *
 * @example
 * ```tsx
 * function PerformanceDashboard() {
 *   const { metrics, refresh, clear } = usePerformanceMetrics({
 *     enableMemoryTracking: true,
 *     refreshInterval: 5000,
 *   });
 *
 *   return (
 *     <div>
 *       <h2>Performance Metrics</h2>
 *       <div>LCP: {metrics.lcp}ms</div>
 *       <div>CLS: {metrics.cls}</div>
 *       <div>Memory: {metrics.memoryUsage?.usedJSHeapSize}MB</div>
 *       <button onClick={refresh}>Refresh</button>
 *       <button onClick={clear}>Clear</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePerformanceMetrics(
  options: { enableMemoryTracking?: boolean; refreshInterval?: number } = {},
) {
  const {
    enableMemoryTracking = true,
    refreshInterval = 0, // 0 = no auto-refresh
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiCallCount: 0,
    cls: null,

    // Custom
    componentRenderCount: 0,
    domContentLoaded: null,
    domProcessing: null,
    fcp: null,
    imageCount: 0,
    imageDuration: 0,
    inp: null,
    // Web Vitals
    lcp: null,

    // Navigation Timing
    loadTime: null,

    // Memory
    memoryUsage: null,
    routeChangeCount: 0,

    // Resource Timing
    scriptCount: 0,
    scriptDuration: 0,
    stylesheetCount: 0,
    stylesheetDuration: 0,
    ttfb: null,
  });

  /**
   * Collect current performance metrics
   */
  const collectMetrics = useCallback(() => {
    const newMetrics: Partial<PerformanceMetrics> = {};

    // Get Web Vitals from performance entries
    const webVitalsEntries = performance.getEntriesByType('largest-contentful-paint');
    if (webVitalsEntries.length > 0) {
      const lcp = webVitalsEntries[webVitalsEntries.length - 1];
      if (lcp) {
        newMetrics.lcp = Math.round(lcp.startTime * 100) / 100;
      }
    }

    // Get navigation timing
    const [navigationEntry] = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];
    if (navigationEntry) {
      newMetrics.loadTime = Math.round(navigationEntry.loadEventEnd * 100) / 100;
      newMetrics.domContentLoaded =
        Math.round(navigationEntry.domContentLoadedEventEnd * 100) / 100;
      newMetrics.domProcessing =
        Math.round((navigationEntry.domComplete - navigationEntry.domInteractive) * 100) / 100;
    }

    // Get resource timing
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const scripts = resources.filter((r) => r.initiatorType === 'script');
    newMetrics.scriptCount = scripts.length;
    newMetrics.scriptDuration =
      Math.round(scripts.reduce((sum, r) => sum + r.duration, 0) * 100) / 100;

    const stylesheets = resources.filter(
      (r) => r.initiatorType === 'link' || r.initiatorType === 'css',
    );
    newMetrics.stylesheetCount = stylesheets.length;
    newMetrics.stylesheetDuration =
      Math.round(stylesheets.reduce((sum, r) => sum + r.duration, 0) * 100) / 100;

    const images = resources.filter((r) => r.initiatorType === 'img');
    newMetrics.imageCount = images.length;
    newMetrics.imageDuration =
      Math.round(images.reduce((sum, r) => sum + r.duration, 0) * 100) / 100;

    // Get memory usage
    if (enableMemoryTracking) {
      newMetrics.memoryUsage = getMemoryUsage();
    }

    // Get custom metrics from performance marks
    const marks = performance.getEntriesByType('mark');
    newMetrics.componentRenderCount = marks.filter((m) => m.name.includes('render')).length;
    newMetrics.apiCallCount = marks.filter((m) => m.name.includes('api')).length;
    newMetrics.routeChangeCount = marks.filter((m) => m.name.includes('route')).length;

    setMetrics((prev) => ({
      ...prev,
      ...newMetrics,
    }));
  }, [enableMemoryTracking]);

  /**
   * Clear all performance metrics
   */
  const clear = useCallback(() => {
    setMetrics({
      apiCallCount: 0,
      cls: null,
      componentRenderCount: 0,
      domContentLoaded: null,
      domProcessing: null,
      fcp: null,
      imageCount: 0,
      imageDuration: 0,
      inp: null,
      lcp: null,
      loadTime: null,
      memoryUsage: null,
      routeChangeCount: 0,
      scriptCount: 0,
      scriptDuration: 0,
      stylesheetCount: 0,
      stylesheetDuration: 0,
      ttfb: null,
    });

    // Clear browser performance data
    try {
      performance.clearMarks();
      performance.clearMeasures();
      performance.clearResourceTimings();
    } catch (error) {
      logger.error('[Performance] Failed to clear performance data:', error);
    }
  }, []);

  /**
   * Manually refresh metrics
   */
  const refresh = useCallback(() => {
    collectMetrics();
  }, [collectMetrics]);

  // Collect metrics on mount
  useEffect(() => {
    collectMetrics();
  }, [collectMetrics]);

  // Auto-refresh if interval is set
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        collectMetrics();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, collectMetrics]);

  // Listen for Web Vitals updates
  useEffect(() => {
    // Listen for LCP updates
    const lcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        setMetrics((prev) => ({
          ...prev,
          lcp: Math.round(entry.startTime * 100) / 100,
        }));
      }
    });

    try {
      lcpObserver.observe({ buffered: true, type: 'largest-contentful-paint' });
    } catch {
      logger.warn('[Performance] LCP observer not supported');
    }

    return () => lcpObserver.disconnect();
  }, []);

  return {
    clear,
    isSupported: 'performance' in window && 'PerformanceObserver' in window,
    metrics,
    refresh,
  };
}

/**
 * Get a summary of performance metrics with ratings
 *
 * @param metrics - Performance metrics
 * @returns Summary with ratings
 *
 * @example
 * ```tsx
 * const { metrics } = usePerformanceMetrics();
 * const summary = getPerformanceSummary(metrics);
 *
 * return (
 *   <div>
 *     <div>LCP: {summary.lcp.value}ms ({summary.lcp.rating})</div>
 *     <div>Load: {summary.loadTime.value}ms ({summary.loadTime.rating})</div>
 *   </div>
 * );
 * ```
 */
export function getPerformanceSummary(metrics: PerformanceMetrics) {
  const getRating = (
    value: number | null,
    thresholds: { good: number; needsImprovement: number },
  ) => {
    if (value === null) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  return {
    cls: {
      rating: getRating(metrics.cls, { good: 0.1, needsImprovement: 0.25 }),
      value: metrics.cls,
    },
    fcp: {
      rating: getRating(metrics.fcp, { good: 1800, needsImprovement: 3000 }),
      value: metrics.fcp,
    },
    inp: {
      rating: getRating(metrics.inp, { good: 200, needsImprovement: 500 }),
      value: metrics.inp,
    },
    lcp: {
      rating: getRating(metrics.lcp, { good: 2500, needsImprovement: 4000 }),
      value: metrics.lcp,
    },
    loadTime: {
      rating: getRating(metrics.loadTime, { good: 3000, needsImprovement: 5000 }),
      value: metrics.loadTime,
    },
    ttfb: {
      rating: getRating(metrics.ttfb, { good: 800, needsImprovement: 1800 }),
      value: metrics.ttfb,
    },
  };
}
