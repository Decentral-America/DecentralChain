import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/i18n';
import App from './App';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { config, devLog } from '@/config';
import { initializeDataService } from '@/config/dataServiceConfig';
import tokenFilterService from '@/services/tokenFilters';
import { stringifyJSON } from '@/utils/formatters';
import './index.css';

// Provide WavesApp.stringifyJSON for data-service compatibility
(window as any).WavesApp = {
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
  console.error('[Main] Token filter initialization failed:', error);
});

// Verify configuration system is working
devLog('Configuration loaded:', {
  environment: config.isDevelopment ? 'Development' : 'Production',
  network: config.network,
  nodeUrl: config.nodeUrl,
  apiUrl: config.apiUrl,
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
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
