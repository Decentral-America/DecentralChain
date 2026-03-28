import * as Sentry from '@sentry/browser';
import type { ErrorInfo } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from './ErrorBoundary';

vi.mock('@sentry/browser', () => ({
  captureException: vi.fn(),
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDerivedStateFromError', () => {
    it('returns hasError: true for any thrown error', () => {
      const state = ErrorBoundary.getDerivedStateFromError(new Error('render failed'));
      expect(state).toEqual({ hasError: true });
    });

    it('returns hasError: true regardless of error type', () => {
      const state = ErrorBoundary.getDerivedStateFromError(new TypeError('unexpected null'));
      expect(state).toEqual({ hasError: true });
    });
  });

  describe('componentDidCatch', () => {
    it('reports the error to Sentry with the component stack', () => {
      const instance = new ErrorBoundary({ children: null });
      const error = new Error('boom');
      const errorInfo: ErrorInfo = { componentStack: '\n    at SomeWidget\n    at App' };

      instance.componentDidCatch(error, errorInfo);

      expect(Sentry.captureException).toHaveBeenCalledOnce();
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: { componentStack: errorInfo.componentStack },
      });
    });

    it('does not suppress the error — rethrow is left to React', () => {
      const instance = new ErrorBoundary({ children: null });
      const error = new Error('silent?');
      const errorInfo: ErrorInfo = { componentStack: '\n    at Root' };

      // componentDidCatch must not throw — React owns the throw lifecycle
      expect(() => instance.componentDidCatch(error, errorInfo)).not.toThrow();
    });
  });
});
