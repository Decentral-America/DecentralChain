/**
 * Security Test Suite: secureTransfer
 *
 * Tests one-time in-memory seed transfer module that replaces
 * passing seed phrases via React Router state.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSeedTransfer, consumeSeedTransfer, setSeedTransfer } from '@/lib/secureTransfer';

describe('secureTransfer', () => {
  beforeEach(() => {
    clearSeedTransfer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    clearSeedTransfer();
    vi.useRealTimers();
  });

  it('stores and returns seed on first consume', () => {
    const seed = 'test seed phrase for wallet recovery';
    setSeedTransfer(seed);
    expect(consumeSeedTransfer()).toBe(seed);
  });

  it('returns null on second consume (one-time read)', () => {
    const seed = 'test seed phrase';
    setSeedTransfer(seed);
    consumeSeedTransfer(); // first read
    expect(consumeSeedTransfer()).toBeNull();
  });

  it('returns null when nothing was set', () => {
    expect(consumeSeedTransfer()).toBeNull();
  });

  it('auto-expires after 30 seconds', () => {
    setSeedTransfer('expiring seed');
    vi.advanceTimersByTime(30_001);
    expect(consumeSeedTransfer()).toBeNull();
  });

  it('does NOT expire before 30 seconds', () => {
    setSeedTransfer('still valid seed');
    vi.advanceTimersByTime(29_999);
    expect(consumeSeedTransfer()).toBe('still valid seed');
  });

  it('clearSeedTransfer removes pending data', () => {
    setSeedTransfer('to be cleared');
    clearSeedTransfer();
    expect(consumeSeedTransfer()).toBeNull();
  });

  it('overwrites previous seed when set again', () => {
    setSeedTransfer('first seed');
    setSeedTransfer('second seed');
    expect(consumeSeedTransfer()).toBe('second seed');
  });

  it('does not expose seed after clear even within timeout', () => {
    setSeedTransfer('sensitive data');
    vi.advanceTimersByTime(5_000);
    clearSeedTransfer();
    vi.advanceTimersByTime(25_000);
    expect(consumeSeedTransfer()).toBeNull();
  });
});
