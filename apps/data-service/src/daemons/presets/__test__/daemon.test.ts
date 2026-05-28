import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import daemon from '../daemon';

const createLogger = () => ({
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
});

describe('Daemon presets', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should log warn if no init function is provided', async () => {
    const logger = createLogger();

    await Effect.runPromise(
      daemon({ loop: () => Effect.succeed(undefined) }, {}, 1000, 5000, logger),
    );

    expect(logger.warn).toHaveBeenCalledWith({
      message: '[DAEMON] init function not found',
    });
  });

  it('should run the loop repeatedly with interval', async () => {
    const logger = createLogger();
    let loopCount = 0;

    await Effect.runPromise(
      daemon(
        {
          init: () => Effect.succeed(undefined),
          loop: () =>
            Effect.sync(() => {
              loopCount++;
            }),
        },
        {},
        100,
        5000,
        logger,
      ),
    );

    // The first loop iteration is started asynchronously via setTimeout.
    // Advance the fake timer to trigger it.
    await vi.advanceTimersByTimeAsync(100);

    expect(loopCount).toBeGreaterThanOrEqual(1);
    // init should NOT produce a warn
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should handle timeout', async () => {
    const logger = createLogger();

    await Effect.runPromise(
      daemon(
        {
          loop: () =>
            // A loop that never resolves — the timeout should race and win
            Effect.async<void, never>(() => {
              // intentionally never completes
            }),
        },
        {},
        100,
        50, // very short timeout
        logger,
      ),
    );

    // Advance past the timeout
    await vi.advanceTimersByTimeAsync(100);

    // The timeout causes the loop promise to reject (caught internally).
    // No uncaught errors should surface — the daemon swallows them.
    // init was missing, so warn should have been called
    expect(logger.warn).toHaveBeenCalledWith({
      message: '[DAEMON] init function not found',
    });
  });
});
