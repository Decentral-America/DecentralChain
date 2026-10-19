import { afterEach, describe, expect, it, vi } from 'vitest';
import { installGracefulShutdown } from './shutdown';

const setup = (
  closeBehaviour: (cb: (err?: Error) => void) => void,
  closeResources?: () => Promise<void>,
) => {
  const handlers = new Map<string, () => void>();
  const exit = vi.fn();
  const close = vi.fn((cb?: (err?: Error) => void) => {
    if (cb) closeBehaviour(cb);
  });
  installGracefulShutdown({
    ...(closeResources ? { closeResources } : {}),
    exit,
    graceMs: 1_000,
    log: () => undefined,
    onSignal: (signal, handler) => {
      handlers.set(signal, handler);
    },
    server: { close },
  });
  return { close, exit, handlers };
};

afterEach(() => {
  vi.useRealTimers();
});

describe('installGracefulShutdown', () => {
  it('stops accepting, waits for in-flight requests, then exits 0 on SIGTERM', () => {
    const { close, exit, handlers } = setup((cb) => cb());
    handlers.get('SIGTERM')?.();
    expect(close).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('exits 1 when requests do not finish within the grace period', () => {
    vi.useFakeTimers();
    const { exit, handlers } = setup(() => undefined);
    handlers.get('SIGTERM')?.();
    expect(exit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1_000);
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('handles SIGINT and ignores a second signal', () => {
    const { close, handlers } = setup(() => undefined);
    handlers.get('SIGINT')?.();
    handlers.get('SIGTERM')?.();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('clears the grace timer on the happy path so exit(1) never follows exit(0)', () => {
    vi.useFakeTimers();
    const { exit, handlers } = setup((cb) => cb());
    handlers.get('SIGTERM')?.();
    expect(exit).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5_000);
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('exits 1 when server.close reports an error', () => {
    const { exit, handlers } = setup((cb) => cb(new Error('boom')));
    handlers.get('SIGTERM')?.();
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('awaits closeResources after the server drains, then exits 0', async () => {
    let release: () => void = () => undefined;
    const closeResources = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    const { exit, handlers } = setup((cb) => cb(), closeResources);
    handlers.get('SIGTERM')?.();
    expect(closeResources).toHaveBeenCalledTimes(1);
    expect(exit).not.toHaveBeenCalled();
    release();
    await Promise.resolve();
    await Promise.resolve();
    expect(exit).toHaveBeenCalledWith(0);
  });

  it('does not close resources before the server has drained', () => {
    const closeResources = vi.fn(() => Promise.resolve());
    const { handlers } = setup(() => undefined, closeResources);
    handlers.get('SIGTERM')?.();
    expect(closeResources).not.toHaveBeenCalled();
  });

  it('exits 1 when closeResources fails', async () => {
    const { exit, handlers } = setup(
      (cb) => cb(),
      () => Promise.reject(new Error('pool end failed')),
    );
    handlers.get('SIGTERM')?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('exits 1 on grace expiry while closeResources hangs, and exits only once', async () => {
    vi.useFakeTimers();
    const { exit, handlers } = setup(
      (cb) => cb(),
      () => new Promise<void>(() => undefined),
    );
    handlers.get('SIGTERM')?.();
    vi.advanceTimersByTime(1_000);
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(1);
  });
});
