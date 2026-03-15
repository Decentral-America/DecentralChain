import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { config, devLog } from '@/config';
import { initializeDataService } from '@/config/dataServiceConfig';
import i18n from '@/i18n/i18n';
import tokenFilterService from '@/services/tokenFilters';
import { stringifyJSON } from '@/utils/formatters';
import App from './App';
import './index.css';
import { logger } from '@/lib/logger';

// Provide DCCApp.stringifyJSON for data-service compatibility
(window as Window & { DCCApp?: { stringifyJSON: typeof stringifyJSON } }).DCCApp = {
  stringifyJSON,
};

/**
 * HTTPS Enforcement
 * Redirect HTTP to HTTPS in production environment
 * Prevents man-in-the-middle attacks
 */
if (import.meta.env.PROD && location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}

// Initialize data-service BEFORE anything else (matches Angular AppConfig)
initializeDataService();

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
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
