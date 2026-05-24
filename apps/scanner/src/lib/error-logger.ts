/**
 * Error logger with Sentry integration.
 *
 * Set VITE_SENTRY_DSN in your .env to enable Sentry reporting.
 * Errors are always stored in an in-memory ring buffer for local debugging.
 */

import * as Sentry from '@sentry/react';

// Augment Window so __ERROR_LOGGER__ is a known, typed property.
declare global {
  interface Window {
    __ERROR_LOGGER__?: (error: unknown, errorInfo: { componentStack?: string }) => void;
  }
}

const SENTRY_DSN = import.meta.env?.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env?.MODE || 'production',
    // Injected at build time by CI (git tag) or .env.production for local builds.
    // Without this, source maps cannot be associated with a specific release.
    release: import.meta.env?.VITE_APP_VERSION,
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

const warnLog: Array<{
  message: string;
  timestamp: string;
  [key: string]: unknown;
}> = [];

export function logWarn(message: unknown, context: Record<string, unknown> = {}): void {
  const entry: { message: string; timestamp: string; [key: string]: unknown } = {
    message: message instanceof Error ? message.message : String(message),
    timestamp: new Date().toISOString(),
    ...context,
  };

  warnLog.push(entry);
  if (warnLog.length > MAX_LOG_SIZE) {
    warnLog.shift();
  }

  console.warn('[ErrorLogger]', entry.message, context);
  // Warnings are informational; not forwarded to Sentry
}

export function getWarnLog(): Array<{
  message: string;
  timestamp: string;
  [key: string]: unknown;
}> {
  return [...warnLog];
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
  window.__ERROR_LOGGER__ = (error: unknown, errorInfo: { componentStack?: string }) => {
    logError(error, { componentStack: errorInfo?.componentStack, type: 'react_error_boundary' });
  };
}
