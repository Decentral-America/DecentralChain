import { QueryClientProvider } from '@tanstack/react-query';
import { lazy, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import './App.css';
import { AnnouncementProvider } from '@/components/a11y';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { config } from '@/config';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { queryClient } from '@/lib/react-query';
import { router } from '@/routes';
import { GlobalStyles as GlobalStylesBase } from '@/styles';

// React 19 type compatibility cast
const GlobalStyles = GlobalStylesBase as React.ComponentType<Record<string, unknown>>;

// Dev-only tools: lazy + import.meta.env.DEV guard so Rolldown dead-code-eliminates
// the entire PerformanceDashboard → usePerformanceMetrics → web-vitals chain in prod.
// In production, import.meta.env.DEV === false so both consts are null (no bundle cost).
const LazyDevTools = import.meta.env.DEV
  ? lazy(() =>
      Promise.all([
        import('@tanstack/react-query-devtools'),
        import('@/components/PerformanceDashboard'),
      ]).then(([{ ReactQueryDevtools }, { PerformanceDashboard }]) => ({
        default: () => (
          <>
            <ReactQueryDevtools initialIsOpen={false} />
            <PerformanceDashboard />
          </>
        ),
      })),
    )
  : null;

function AppContent() {
  // Initialize analytics lazily — defers react-ga4 off the critical-path bundle.
  useEffect(() => {
    void import('@/lib/analytics').then(({ initAnalytics }) => {
      initAnalytics({
        debug: config.isDevelopment,
        enableInDev: false,
      });
    });
  }, []);

  // Initialize error monitoring lazily — @sentry/react is now NOT statically imported,
  // removing the 82 kB sentry chunk from the initial modulepreload list.
  // Errors before this effect fires are caught by ErrorBoundary (react-error-boundary).
  useEffect(() => {
    void import('@/lib/errorMonitoring').then(({ initErrorMonitoring }) => {
      initErrorMonitoring({
        debug: config.isDevelopment,
        enableInDev: false,
        environment: config.isDevelopment ? 'development' : 'production',
        tracesSampleRate: config.isDevelopment ? 1.0 : 0.1,
      });
    });
  }, []);

  // Initialize performance monitoring lazily — defers web-vitals off the critical path.
  useEffect(() => {
    void import('@/lib/performanceMonitoring').then(({ initPerformanceMonitoring }) => {
      initPerformanceMonitoring({
        debug: config.isDevelopment,
        enableInDev: false,
        enableNavigationTiming: true,
        enableResourceTiming: true,
        enableWebVitals: true,
        reportToAnalytics: true,
        reportToErrorMonitoring: true,
      });
    });
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      {import.meta.env.DEV && LazyDevTools && <LazyDevTools />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <GlobalStyles />
          <AnnouncementProvider>
            <ToastProvider>
              <ConfigProvider>
                <AppContent />
              </ConfigProvider>
            </ToastProvider>
          </AnnouncementProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
