import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { config, devLog } from '@/config';
import i18n from '@/i18n/i18n';
import tokenFilterService from '@/services/tokenFilters';
import App from './App';
import './index.css';
import { logger } from '@/lib/logger';

/**
 * HTTPS Enforcement
 * Redirect HTTP to HTTPS in production environment
 * Prevents man-in-the-middle attacks
 */
if (import.meta.env.PROD && location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}

// Initialize token filters (scam list and token names)
tokenFilterService.initialize().catch((error) => {
  logger.error('[Main] Token filter initialization failed:', error);
});

// Verify configuration system is working
devLog('Configuration loaded:', {
  apiUrl: config.apiUrl,
  environment: config.isDevelopment ? 'Development' : 'Production',
  network: config.network,
  nodeUrl: config.nodeUrl,
});

/**
 * Context Provider Hierarchy
 *
 * App.tsx already contains all necessary providers:
 * - ErrorBoundary
 * - QueryClientProvider
 * - ThemeProvider
 * - AnnouncementProvider
 * - ToastProvider
 * - ConfigProvider
 * - AuthProvider
 * - RouterProvider
 *
 * Main.tsx only needs:
 * 1. ErrorBoundary - Top-level error catching
 * 2. I18nextProvider - Translation support (needed globally)
 */
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// Wire React 19's native error propagation hooks to the error monitoring service.
// Using a dynamic import keeps @sentry/react out of the initial modulepreload list
// (lazy init in App.tsx is the intentional perf pattern). In practice Sentry is
// initialized within the first frame; errors before that fall back to the ErrorBoundary.
const reactErrorHandler = (
  error: unknown,
  errorInfo?: { componentStack?: string | null | undefined },
): void => {
  void import('@/lib/errorMonitoring').then(({ captureError }) => {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      componentStack: errorInfo?.componentStack,
      type: 'react_root_error',
    });
  });
};

ReactDOM.createRoot(rootElement, {
  onCaughtError: (error, errorInfo) => reactErrorHandler(error, errorInfo),
  onRecoverableError: (error, errorInfo) => reactErrorHandler(error, errorInfo),
  onUncaughtError: (error, errorInfo) => reactErrorHandler(error, errorInfo),
}).render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* Suspense gates rendering until i18next-http-backend fetches the active locale.
          fallback=null keeps the HTML loading shell (index.html spinner) visible. */}
      <Suspense fallback={null}>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>,
);
