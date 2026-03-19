import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getErrorLog, logError } from './error-logger';

describe('error-logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs an error and stores it in the log', () => {
    logError(new Error('test error'), { type: 'test' });
    const log = getErrorLog();
    const entry = log.find((e) => e.message === 'test error');
    expect(entry).toBeDefined();
    if (!entry) {
      throw new Error('Expected log entry to exist');
    }
    expect(entry.type).toBe('test');
    expect(entry.timestamp).toBeDefined();
  });

  it('handles non-Error objects', () => {
    logError('string error');
    const log = getErrorLog();
    const entry = log.find((e) => e.message === 'string error');
    expect(entry).toBeDefined();
  });

  it('returns a copy of the log (not the internal array)', () => {
    logError(new Error('a'));
    const log1 = getErrorLog();
    const log2 = getErrorLog();
    expect(log1).not.toBe(log2);
    expect(log1).toEqual(log2);
  });

  it('logs to console.error', () => {
    logError(new Error('console test'));
    expect(console.error).toHaveBeenCalledWith('[ErrorLogger]', 'console test', expect.any(Object));
  });

  it('stores stack trace for Error instances', () => {
    logError(new Error('with stack'));
    const log = getErrorLog();
    const entry = log.find((e) => e.message === 'with stack');
    expect(entry?.stack).toBeTruthy();
  });

  it('stack is undefined for non-Error values', () => {
    logError(42);
    const log = getErrorLog();
    const entry = log.find((e) => e.message === '42');
    expect(entry).toBeDefined();
    expect(entry?.stack).toBeUndefined();
  });

  it('ring buffer trims oldest entry when exceeding 100 entries', () => {
    // Log 101 errors — the first one should be evicted
    const firstMessage = 'ring-buffer-evict-first';
    logError(new Error(firstMessage));
    for (let i = 0; i < 100; i++) {
      logError(new Error(`ring-buffer-fill-${i}`));
    }
    const log = getErrorLog();
    expect(log).toHaveLength(100);
    const evicted = log.find((e) => e.message === firstMessage);
    expect(evicted).toBeUndefined();
  });

  it('dispatches window error event to the logger', () => {
    logError(new Error('pre-event'));
    const before = getErrorLog().length;
    const errorEvent = new ErrorEvent('error', {
      error: new Error('window-error-event'),
      filename: 'test.ts',
      lineno: 1,
      message: 'window-error-event',
    });
    window.dispatchEvent(errorEvent);
    const log = getErrorLog();
    const entry = log.find((e) => e.message === 'window-error-event');
    expect(log.length).toBeGreaterThanOrEqual(before);
    expect(entry).toBeDefined();
    expect(entry?.type).toBe('unhandled_error');
  });

  it('dispatches unhandledrejection event to the logger', () => {
    const reason = new Error('unhandled-rejection-reason');
    // Catch the rejected promise immediately to avoid Vitest unhandled rejection noise;
    // the PromiseRejectionEvent only needs a Promise reference, not the actual rejection.
    const promise = Promise.reject(reason);
    void promise.catch(() => {});
    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', { promise, reason });
    window.dispatchEvent(rejectionEvent);
    const log = getErrorLog();
    const entry = log.find((e) => e.message === 'unhandled-rejection-reason');
    expect(entry).toBeDefined();
    expect(entry?.type).toBe('unhandled_rejection');
  });
});
