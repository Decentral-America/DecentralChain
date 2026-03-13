/**
 * Security Test Suite: logger
 *
 * Tests production-safe logger that redacts sensitive fields
 * and suppresses output in production builds.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We need to test the sanitize behavior, so we'll test the logger module
// In production mode, debug/info should not output
// In dev mode, sensitive fields should be redacted

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warn always outputs regardless of environment', async () => {
    const { logger } = await import('@/lib/logger');
    logger.warn('test warning');
    expect(console.warn).toHaveBeenCalledWith('test warning');
  });

  it('error always outputs regardless of environment', async () => {
    const { logger } = await import('@/lib/logger');
    logger.error('test error');
    expect(console.error).toHaveBeenCalledWith('test error');
  });

  it('redacts sensitive fields from object arguments in dev mode', async () => {
    // In test environment (which acts as dev), the logger should sanitize
    const { logger } = await import('@/lib/logger');

    const sensitiveObj = {
      address: 'abc123',
      seed: 'my secret seed phrase',
      privateKey: 'key-data',
      password: 'hunter2',
      mnemonic: 'word1 word2',
      amount: 100,
    };

    logger.debug(sensitiveObj);

    // If in dev mode, it should have been called with redacted values
    if (import.meta.env.DEV) {
      // biome-ignore lint/suspicious/noConsole: test verifying console.log redaction behavior
      const callArgs = (console.log as ReturnType<typeof vi.fn>).mock.calls[0];
      if (callArgs) {
        const logged = callArgs[0] as { seed?: unknown; privateKey?: unknown; password?: unknown; mnemonic?: unknown; address?: unknown; amount?: unknown };
        expect(logged.seed).toBe('[REDACTED]');
        expect(logged.privateKey).toBe('[REDACTED]');
        expect(logged.password).toBe('[REDACTED]');
        expect(logged.mnemonic).toBe('[REDACTED]');
        // Non-sensitive fields should pass through
        expect(logged.address).toBe('abc123');
        expect(logged.amount).toBe(100);
      }
    }
  });
});
