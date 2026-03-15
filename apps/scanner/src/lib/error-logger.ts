/**
 * Error logger with Sentry integration.
 *
 * Set VITE_SENTRY_DSN in your .env to enable Sentry reporting.
 * Errors are always stored in an in-memory ring buffer for local debugging.
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env?.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env?.MODE || 'production',
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    tracesSampleRate: 0.2,
  });
}

const MAX_LOG_SIZE = 100;
const errorLog: Array<{
  message: string;
  stack?: string;
  timestamp: string;
  [key: string]: unknown;
}> = [];

function logToService(error: unknown, context: Record<string, unknown>): void {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

export function logError(error: unknown, context: Record<string, unknown> = {}): void {
  const entry: { message: string; stack?: string; timestamp: string; [key: string]: unknown } = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Keep in-memory ring buffer for debugging
  errorLog.push(entry);
  if (errorLog.length > MAX_LOG_SIZE) {
    errorLog.shift();
  }

  console.error('[ErrorLogger]', entry.message, context);
  logToService(error, context);
}

export function getErrorLog(): Array<{
  message: string;
  stack?: string;
  timestamp: string;
  [key: string]: unknown;
}> {
  return [...errorLog];
}

// Global unhandled error & rejection handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      type: 'unhandled_error',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, { type: 'unhandled_rejection' });
  });

  // Expose logger for ErrorBoundary
  (window as unknown as Record<string, unknown>).__ERROR_LOGGER__ = (
    error: unknown,
    errorInfo: { componentStack?: string },
  ) => {
    logError(error, { componentStack: errorInfo?.componentStack, type: 'react_error_boundary' });
  };
}
