/**
 * Performance Metrics Dashboard Hook
 *
 * Hook to display current performance metrics in dev mode
 */

import { useState, useEffect, useCallback } from 'react';
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
  options: {
    enableMemoryTracking?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const {
    enableMemoryTracking = true,
    refreshInterval = 0, // 0 = no auto-refresh
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    // Web Vitals
    lcp: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null,

    // Navigation Timing
    loadTime: null,
    domContentLoaded: null,
    domProcessing: null,

    // Resource Timing
    scriptCount: 0,
    scriptDuration: 0,
    stylesheetCount: 0,
    stylesheetDuration: 0,
    imageCount: 0,
    imageDuration: 0,

    // Memory
    memoryUsage: null,

    // Custom
    componentRenderCount: 0,
    apiCallCount: 0,
    routeChangeCount: 0,
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
      newMetrics.lcp = Math.round(lcp.startTime * 100) / 100;
    }

    // Get navigation timing
    const [navigationEntry] = performance.getEntriesByType(
      'navigation'
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
      (r) => r.initiatorType === 'link' || r.initiatorType === 'css'
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
      lcp: null,
      cls: null,
      fcp: null,
      ttfb: null,
      inp: null,
      loadTime: null,
      domContentLoaded: null,
      domProcessing: null,
      scriptCount: 0,
      scriptDuration: 0,
      stylesheetCount: 0,
      stylesheetDuration: 0,
      imageCount: 0,
      imageDuration: 0,
      memoryUsage: null,
      componentRenderCount: 0,
      apiCallCount: 0,
      routeChangeCount: 0,
    });

    // Clear browser performance data
    try {
      performance.clearMarks();
      performance.clearMeasures();
      performance.clearResourceTimings();
    } catch (error) {
      console.error('[Performance] Failed to clear performance data:', error);
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
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('[Performance] LCP observer not supported');
    }

    return () => lcpObserver.disconnect();
  }, []);

  return {
    metrics,
    refresh,
    clear,
    isSupported: 'performance' in window && 'PerformanceObserver' in window,
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
    thresholds: { good: number; needsImprovement: number }
  ) => {
    if (value === null) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  return {
    lcp: {
      value: metrics.lcp,
      rating: getRating(metrics.lcp, { good: 2500, needsImprovement: 4000 }),
    },
    cls: {
      value: metrics.cls,
      rating: getRating(metrics.cls, { good: 0.1, needsImprovement: 0.25 }),
    },
    fcp: {
      value: metrics.fcp,
      rating: getRating(metrics.fcp, { good: 1800, needsImprovement: 3000 }),
    },
    ttfb: {
      value: metrics.ttfb,
      rating: getRating(metrics.ttfb, { good: 800, needsImprovement: 1800 }),
    },
    inp: {
      value: metrics.inp,
      rating: getRating(metrics.inp, { good: 200, needsImprovement: 500 }),
    },
    loadTime: {
      value: metrics.loadTime,
      rating: getRating(metrics.loadTime, { good: 3000, needsImprovement: 5000 }),
    },
  };
}
