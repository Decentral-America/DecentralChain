# Performance Monitoring Guide

Complete guide to performance monitoring with Web Vitals, resource timing, and custom metrics.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Core Concepts](#core-concepts)
4. [Web Vitals](#web-vitals)
5. [Performance Tracking](#performance-tracking)
6. [React Hooks](#react-hooks)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

The performance monitoring system tracks:
- **Web Vitals**: Google's Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP)
- **Navigation Timing**: DNS, TCP, request/response, DOM processing
- **Resource Timing**: Script, stylesheet, image loading performance
- **Custom Metrics**: Component render time, API calls, route changes
- **Memory Usage**: JavaScript heap monitoring
- **Long Tasks**: Blocking tasks detection (> 50ms)

All metrics are automatically reported to:
- **Analytics** (Google Analytics 4 + Amplitude)
- **Error Monitoring** (Sentry) - for poor performance

## Getting Started

### 1. Initialize Performance Monitoring

Performance monitoring is automatically initialized in `App.tsx`:

```tsx
import { initPerformanceMonitoring } from '@/lib/performanceMonitoring';

function AppContent() {
  useEffect(() => {
    initPerformanceMonitoring({
      enableWebVitals: true,           // Track Core Web Vitals
      enableResourceTiming: true,      // Track resource loading
      enableNavigationTiming: true,    // Track navigation timing
      enableInDev: false,              // Enable in development
      debug: import.meta.env.DEV,      // Debug mode
      reportToAnalytics: true,         // Send to analytics
      reportToErrorMonitoring: true,   // Send poor metrics to Sentry
    });
  }, []);
}
```

### 2. Track Route Performance

Automatically track route change performance:

```tsx
import { useRoutePerformance } from '@/hooks/usePerformanceMonitoring';

function App() {
  useRoutePerformance(); // Tracks time to interactive for each route
  
  return <RouterProvider router={router} />;
}
```

## Core Concepts

### Performance Configuration

```typescript
interface PerformanceMonitoringConfig {
  enableWebVitals?: boolean;           // Default: true
  enableResourceTiming?: boolean;      // Default: true
  enableNavigationTiming?: boolean;    // Default: true
  enableInDev?: boolean;               // Default: false
  debug?: boolean;                     // Default: import.meta.env.DEV
  reportToAnalytics?: boolean;         // Default: true
  reportToErrorMonitoring?: boolean;   // Default: true
}
```

### Performance Thresholds

Based on Google's Web Vitals standards:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP    | ≤ 2500ms | 2500ms - 4000ms | > 4000ms |
| FID    | ≤ 100ms | 100ms - 300ms | > 300ms |
| CLS    | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP    | ≤ 1800ms | 1800ms - 3000ms | > 3000ms |
| TTFB   | ≤ 800ms | 800ms - 1800ms | > 1800ms |
| INP    | ≤ 200ms | 200ms - 500ms | > 500ms |

## Web Vitals

### What are Web Vitals?

Web Vitals are essential metrics for measuring user experience:

1. **LCP (Largest Contentful Paint)**: Loading performance
   - Measures when the largest content element becomes visible
   - Good: ≤ 2.5 seconds

2. **FID (First Input Delay)**: Interactivity
   - Measures time from user interaction to browser response
   - Good: ≤ 100 milliseconds

3. **CLS (Cumulative Layout Shift)**: Visual stability
   - Measures unexpected layout shifts
   - Good: ≤ 0.1

4. **FCP (First Contentful Paint)**: Loading
   - Measures when first content renders
   - Good: ≤ 1.8 seconds

5. **TTFB (Time to First Byte)**: Server response
   - Measures time to first byte from server
   - Good: ≤ 800 milliseconds

6. **INP (Interaction to Next Paint)**: Responsiveness (NEW in 2023)
   - Measures overall responsiveness to user interactions
   - Good: ≤ 200 milliseconds

### Automatic Tracking

Web Vitals are automatically tracked on page load:

```typescript
// Automatically called by initPerformanceMonitoring
import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';

onLCP((metric) => {
  // Sent to analytics: trackEvent('Web Vitals', 'LCP', 'good', 1234.56)
  // If poor: sent to Sentry with warning severity
});
```

### Viewing Web Vitals

Web Vitals are sent to:

1. **Google Analytics 4**:
   - Category: `Web Vitals`
   - Action: `LCP`, `FID`, `CLS`, `FCP`, `TTFB`, `INP`
   - Label: `good`, `needs-improvement`, `poor`
   - Value: Metric value (rounded to 2 decimals)

2. **Amplitude**:
   - Event: `Web Vitals`
   - Properties: `{ metric, value, rating, delta }`

3. **Sentry** (if poor performance):
   - Message: `Poor LCP performance`
   - Severity: `Warning`
   - Context: `{ metric, value, rating, threshold }`

## Performance Tracking

### Navigation Timing

Tracks page navigation performance:

```typescript
const metrics = {
  dns: 'DNS lookup time',
  tcp: 'TCP connection time',
  request: 'Request time',
  response: 'Response time',
  domProcessing: 'DOM processing time',
  domContentLoaded: 'DOM content loaded time',
  loadComplete: 'Full page load time',
};

// Automatically tracked on page load
// Sent to analytics: trackEvent('Navigation Timing', 'dns', undefined, 123.45)
```

### Resource Timing

Tracks resource loading performance grouped by type:

```typescript
// Automatically tracks all resources:
const resourceTypes = [
  'script',      // JavaScript files
  'stylesheet',  // CSS files
  'img',        // Images
  'fetch',      // Fetch requests
  'xmlhttprequest', // XHR requests
  'other',      // Other resources
];

// For each type, reports:
// - count: Number of resources
// - avgDuration: Average loading time
// - totalDuration: Total loading time
```

### Memory Usage

Track JavaScript heap memory usage:

```typescript
import { getMemoryUsage } from '@/lib/performanceMonitoring';

const memory = getMemoryUsage();
// {
//   usedJSHeapSize: 45.23,      // MB
//   totalJSHeapSize: 67.89,     // MB
//   jsHeapSizeLimit: 2048.00,   // MB
// }
```

### Long Task Detection

Automatically detect blocking tasks:

```typescript
import { trackLongTasks } from '@/lib/performanceMonitoring';

// Start tracking long tasks (> 50ms)
trackLongTasks();

// Long tasks are sent to:
// - Analytics: trackEvent('Long Task', taskName, undefined, duration)
// - Sentry (if > 100ms): captureMessage('Long task detected', Warning)
```

### Custom Performance Marks

Create custom performance markers:

```typescript
import { markPerformance, measurePerformance, clearPerformance } from '@/lib/performanceMonitoring';

// Mark start
markPerformance('data-fetch-start');

// ... perform operation ...

// Mark end
markPerformance('data-fetch-end');

// Measure duration
const duration = measurePerformance('data-fetch', 'data-fetch-start', 'data-fetch-end');
// Returns: 123.45 (milliseconds)

// Clean up
clearPerformance('data-fetch-start');
clearPerformance('data-fetch-end');
clearPerformance('data-fetch');
```

### Predefined Tracking Functions

Quick helpers for common operations:

```typescript
import { performance } from '@/lib/performanceMonitoring';

// Track API call
performance.apiCall('getTransactions', 234.56);
// → trackEvent('API Performance', 'getTransactions', undefined, 234.56)

// Track component render
performance.componentRender('Dashboard', 12.34);
// → trackEvent('Component Performance', 'Dashboard', undefined, 12.34)

// Track route change
performance.routeChange('/wallet', 345.67);
// → trackEvent('Route Performance', '/wallet', undefined, 345.67)

// Track data loading
performance.dataLoad('transactions', 456.78);
// → trackEvent('Data Load Performance', 'transactions', undefined, 456.78)
```

## React Hooks

### useRenderTime

Track component render time:

```tsx
import { useRenderTime } from '@/hooks/usePerformanceMonitoring';

function Dashboard() {
  useRenderTime('Dashboard');
  
  return (
    <div>
      <h1>Dashboard</h1>
      {/* Component content */}
    </div>
  );
}

// Automatically tracks render duration
// Sent to: trackEvent('Component Performance', 'Dashboard', undefined, duration)
```

### useRoutePerformance

Track route change performance:

```tsx
import { useRoutePerformance } from '@/hooks/usePerformanceMonitoring';

function App() {
  useRoutePerformance();
  
  return <RouterProvider router={router} />;
}

// Tracks time from route change to interactive
// Sent to: trackEvent('Route Performance', pathname, undefined, duration)
```

### useDataLoadPerformance

Track data loading performance:

```tsx
import { useDataLoadPerformance } from '@/hooks/usePerformanceMonitoring';

function TransactionList() {
  const { data, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });
  
  useDataLoadPerformance('transactions', isLoading);
  
  return (
    <div>
      {data?.map(tx => <TransactionItem key={tx.id} {...tx} />)}
    </div>
  );
}

// Tracks time from loading start to complete
// Sent to: trackEvent('Data Load Performance', 'transactions', undefined, duration)
```

### useApiPerformance

Track API call performance:

```tsx
import { useApiPerformance } from '@/hooks/usePerformanceMonitoring';

function useTransactions() {
  const markComplete = useApiPerformance('fetchTransactions');
  
  const { data } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const result = await fetch('/api/transactions');
      markComplete(); // Mark API call as complete
      return result.json();
    },
  });
  
  return { data };
}

// Tracks API call duration
// Sent to: trackEvent('API Performance', 'fetchTransactions', undefined, duration)
```

### usePerformanceMetric

Track custom performance metrics:

```tsx
import { usePerformanceMetric } from '@/hooks/usePerformanceMonitoring';

function DataProcessor() {
  const { start, end } = usePerformanceMetric('data-processing');
  
  const handleProcess = () => {
    start();
    
    // Complex calculation
    const result = processLargeDataset(data);
    
    const duration = end();
    console.log(`Processing took ${duration}ms`);
  };
  
  return <button onClick={handleProcess}>Process Data</button>;
}
```

## Best Practices

### 1. Track Critical User Journeys

```tsx
// Track wallet creation flow
function CreateWallet() {
  const { start, end } = usePerformanceMetric('wallet-creation');
  
  const handleCreate = async () => {
    start();
    await createWallet();
    end();
  };
}

// Track transaction sending
function SendTransaction() {
  const { start, end } = usePerformanceMetric('transaction-send');
  
  const handleSend = async () => {
    start();
    await sendTransaction();
    end();
  };
}
```

### 2. Monitor Expensive Components

```tsx
// Track expensive renders
function ComplexChart() {
  useRenderTime('ComplexChart');
  
  return <ExpensiveVisualization data={data} />;
}
```

### 3. Track Data Loading

```tsx
// Track all data queries
function useBalances() {
  const { data, isLoading } = useQuery({
    queryKey: ['balances'],
    queryFn: fetchBalances,
  });
  
  useDataLoadPerformance('balances', isLoading);
  
  return { data };
}
```

### 4. Monitor API Performance

```tsx
// Track API calls
function useApi() {
  const markComplete = useApiPerformance('api-call');
  
  const call = async (endpoint: string) => {
    const response = await fetch(endpoint);
    markComplete();
    return response;
  };
  
  return { call };
}
```

### 5. Set Performance Budgets

```typescript
// Set up performance budgets
const PERFORMANCE_BUDGETS = {
  // Component render times
  'Dashboard': 100,        // 100ms max
  'TransactionList': 50,   // 50ms max
  
  // Data loading times
  'transactions': 1000,    // 1s max
  'balances': 500,        // 500ms max
  
  // API call times
  'getTransactions': 2000, // 2s max
  'sendTransaction': 5000, // 5s max
};

// Monitor and alert on budget violations
performance.componentRender('Dashboard', duration);
if (duration > PERFORMANCE_BUDGETS['Dashboard']) {
  console.warn(`Dashboard exceeded budget: ${duration}ms > ${PERFORMANCE_BUDGETS['Dashboard']}ms`);
}
```

### 6. Optimize Based on Data

```typescript
// Analyze performance data
const performanceReport = {
  slowComponents: [
    { name: 'Dashboard', avgTime: 123, count: 45 },
    { name: 'Chart', avgTime: 234, count: 89 },
  ],
  slowAPIs: [
    { endpoint: 'getTransactions', avgTime: 2345, count: 123 },
    { endpoint: 'getBalances', avgTime: 1234, count: 234 },
  ],
  poorWebVitals: [
    { metric: 'LCP', value: 4567, threshold: 2500 },
  ],
};

// Prioritize optimizations:
// 1. Fix poor Web Vitals (impacts SEO and user experience)
// 2. Optimize slow components (especially high-frequency renders)
// 3. Optimize slow APIs (especially high-frequency calls)
```

## Troubleshooting

### Web Vitals Not Tracking

**Problem**: Web Vitals metrics not appearing in analytics

**Solutions**:

1. **Check initialization**:
   ```tsx
   initPerformanceMonitoring({
     enableWebVitals: true, // Make sure this is true
   });
   ```

2. **Check browser support**:
   - Web Vitals require modern browsers (Chrome 77+, Edge 79+, Firefox 86+)
   - Safari has limited support

3. **Check analytics initialization**:
   ```tsx
   // Make sure analytics is initialized before performance monitoring
   initAnalytics({ ... });
   initPerformanceMonitoring({ ... });
   ```

### Poor Performance Alerts

**Problem**: Too many poor performance alerts in Sentry

**Solutions**:

1. **Disable alerts for specific metrics**:
   ```tsx
   initPerformanceMonitoring({
     reportToErrorMonitoring: false, // Disable all alerts
   });
   ```

2. **Filter alerts by severity**:
   ```typescript
   // Only alert on very poor performance
   if (rating === 'poor' && value > threshold * 2) {
     captureMessage('Very poor performance', ErrorSeverity.Error);
   }
   ```

3. **Set custom thresholds**:
   ```typescript
   const CUSTOM_THRESHOLDS = {
     LCP: { good: 3000, needsImprovement: 5000 }, // More lenient
   };
   ```

### High Memory Usage

**Problem**: Application using too much memory

**Solutions**:

1. **Track memory usage**:
   ```tsx
   import { getMemoryUsage } from '@/lib/performanceMonitoring';
   
   useEffect(() => {
     const interval = setInterval(() => {
       const memory = getMemoryUsage();
       if (memory && memory.usedJSHeapSize > 100) {
         console.warn('High memory usage:', memory);
       }
     }, 10000); // Check every 10 seconds
     
     return () => clearInterval(interval);
   }, []);
   ```

2. **Profile memory leaks**:
   - Use Chrome DevTools Memory Profiler
   - Look for detached DOM nodes
   - Check for event listener leaks

3. **Optimize component cleanup**:
   ```tsx
   useEffect(() => {
     const subscription = subscribe();
     return () => subscription.unsubscribe(); // Clean up
   }, []);
   ```

### Long Tasks Detection

**Problem**: Application feels sluggish

**Solutions**:

1. **Enable long task tracking**:
   ```tsx
   import { trackLongTasks } from '@/lib/performanceMonitoring';
   
   useEffect(() => {
     trackLongTasks(); // Detect tasks > 50ms
   }, []);
   ```

2. **Break up long tasks**:
   ```tsx
   // Bad: Long synchronous task
   const result = data.map(item => expensiveOperation(item));
   
   // Good: Break into chunks
   const processChunk = async (chunk: any[]) => {
     const result = chunk.map(item => expensiveOperation(item));
     await new Promise(resolve => setTimeout(resolve, 0)); // Yield to browser
     return result;
   };
   
   const chunks = chunkArray(data, 100);
   const results = await Promise.all(chunks.map(processChunk));
   ```

3. **Use Web Workers**:
   ```tsx
   // Offload heavy computation to worker
   const worker = new Worker('/workers/calculation.js');
   worker.postMessage(data);
   worker.onmessage = (e) => {
     const result = e.data;
   };
   ```

### Performance in Development

**Problem**: Performance tracking affects development experience

**Solutions**:

1. **Disable in development**:
   ```tsx
   initPerformanceMonitoring({
     enableInDev: false, // Default
   });
   ```

2. **Enable only for testing**:
   ```tsx
   // Use environment variable
   const TEST_PERFORMANCE = import.meta.env.VITE_TEST_PERFORMANCE === 'true';
   
   initPerformanceMonitoring({
     enableInDev: TEST_PERFORMANCE,
   });
   ```

3. **Use debug mode**:
   ```tsx
   initPerformanceMonitoring({
     debug: true, // Console logging only
     reportToAnalytics: false,
     reportToErrorMonitoring: false,
   });
   ```

---

## Summary

Performance monitoring provides:
- ✅ **Web Vitals tracking** (LCP, FID, CLS, FCP, TTFB, INP)
- ✅ **Navigation timing** (DNS, TCP, request/response, DOM)
- ✅ **Resource timing** (scripts, stylesheets, images)
- ✅ **Custom metrics** (components, APIs, routes, data)
- ✅ **Memory tracking** (JavaScript heap)
- ✅ **Long task detection** (blocking tasks > 50ms)
- ✅ **Automatic reporting** (Analytics + Error Monitoring)
- ✅ **React hooks** (5 hooks for common scenarios)
- ✅ **Performance budgets** (threshold-based alerts)

For more information:
- **Analytics**: See [ANALYTICS.md](./ANALYTICS.md)
- **Error Monitoring**: See [ERROR_MONITORING.md](./ERROR_MONITORING.md)
- **Web Vitals**: https://web.dev/vitals/
- **web-vitals Library**: https://github.com/GoogleChrome/web-vitals
