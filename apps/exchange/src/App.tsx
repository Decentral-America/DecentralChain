import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router-dom';
import './App.css';
import { queryClient } from '@/lib/react-query';
import { config } from '@/config';
import {
  AuthProvider,
  ThemeProvider,
  ConfigProvider,
  ToastProvider,
  SettingsProvider,
  LedgerProvider,
} from '@/contexts';
import { GlobalStyles } from '@/styles';
import { router } from '@/routes';
import { AnnouncementProvider } from '@/components/a11y';
import { initAnalytics } from '@/lib/analytics';
import { initErrorMonitoring, ErrorBoundary } from '@/lib/errorMonitoring';
import { initPerformanceMonitoring } from '@/lib/performanceMonitoring';
import { PerformanceDashboard } from '@/components/PerformanceDashboard';

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
      environment: config.isDevelopment ? 'development' : 'production',
      tracesSampleRate: config.isDevelopment ? 1.0 : 0.1,
      enableInDev: false, // Set to true to test error monitoring in development
      debug: config.isDevelopment,
    });
  }, []);

  // Initialize performance monitoring on mount
  useEffect(() => {
    initPerformanceMonitoring({
      enableWebVitals: true,
      enableResourceTiming: true,
      enableNavigationTiming: true,
      enableInDev: false, // Set to true to test performance monitoring in development
      debug: config.isDevelopment,
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
