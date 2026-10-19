import { afterEach, describe, expect, it, vi } from 'vitest';
import { installGracefulShutdown } from './shutdown';

const setup = (closeBehaviour: (cb: (err?: Error) => void) => void) => {
  const handlers = new Map<string, () => void>();
  const exit = vi.fn();
  const close = vi.fn((cb?: (err?: Error) => void) => {
    if (cb) closeBehaviour(cb);
  });
  installGracefulShutdown({
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
});
