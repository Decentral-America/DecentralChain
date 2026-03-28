import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import './App.css';
import { AnnouncementProvider } from '@/components/a11y';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';
import { config } from '@/config';
import {
  AuthProvider,
  ConfigProvider,
  LedgerProvider,
  SettingsProvider,
  ThemeProvider,
  ToastProvider,
} from '@/contexts';
import { initAnalytics } from '@/lib/analytics';
import { ErrorBoundary, initErrorMonitoring } from '@/lib/errorMonitoring';
import { initPerformanceMonitoring } from '@/lib/performanceMonitoring';
import { queryClient } from '@/lib/react-query';
import { router } from '@/routes';
import { GlobalStyles as GlobalStylesBase } from '@/styles';

// React 19 type compatibility cast
const GlobalStyles = GlobalStylesBase as React.ComponentType<Record<string, unknown>>;

function AppContent() {
  // Initialize analytics on mount
  useEffect(() => {
    initAnalytics({
      debug: config.isDevelopment,
      enableInDev: false, // Set to true to test analytics in development
    });
  }, []);

  // Initialize error monitoring on mount
  useEffect(() => {
    initErrorMonitoring({
      debug: config.isDevelopment,
      enableInDev: false, // Set to true to test error monitoring in development
      environment: config.isDevelopment ? 'development' : 'production',
      tracesSampleRate: config.isDevelopment ? 1.0 : 0.1,
    });
  }, []);

  // Initialize performance monitoring on mount
  useEffect(() => {
    initPerformanceMonitoring({
      debug: config.isDevelopment,
      enableInDev: false, // Set to true to test performance monitoring in development
      enableNavigationTiming: true,
      enableResourceTiming: true,
      enableWebVitals: true,
      reportToAnalytics: true,
      reportToErrorMonitoring: true,
    });
  }, []);

  // Note: Router tracking hooks (usePageTracking, useRoutePerformance)
  // are called inside MainLayout which is within the router context.
  // GlobalKeyboardShortcuts is now in RootLayout within the router.

  return (
    <>
      <RouterProvider router={router} />
      {config.isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
      {config.isDevelopment && <PerformanceDashboard />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary fallback={<div>An error occurred. Please refresh the page.</div>}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <GlobalStyles />
          <AnnouncementProvider>
            <ToastProvider>
              <ConfigProvider>
                <LedgerProvider>
                  <AuthProvider>
                    <SettingsProvider>
                      <AppContent />
                    </SettingsProvider>
                  </AuthProvider>
                </LedgerProvider>
              </ConfigProvider>
            </ToastProvider>
          </AnnouncementProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
