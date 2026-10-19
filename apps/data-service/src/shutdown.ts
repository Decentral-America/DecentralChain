/**
 * Graceful shutdown for the HTTP server.
 *
 * On SIGTERM/SIGINT: stop accepting connections, let in-flight requests finish,
 * release resources (e.g. the Postgres pool), then exit 0. If they do not finish within `graceMs` (keep it under Docker's
 * 10 s stop timeout), exit 1 so the container still stops promptly.
 */

export type ClosableServer = {
  close: (callback?: (err?: Error) => void) => unknown;
};

export type ShutdownDeps = {
  server: ClosableServer;
  log: (message: string, meta?: Record<string, unknown>) => void;
  exit: (code: number) => void;
  onSignal: (signal: NodeJS.Signals, handler: () => void) => void;
  graceMs: number;
  /** Awaited after the server has drained, inside the same grace period. */
  closeResources?: () => Promise<void>;
};

export const installGracefulShutdown = ({
  server,
  log,
  exit,
  onSignal,
  graceMs,
  closeResources,
}: ShutdownDeps): void => {
  let shuttingDown = false;

  const shutdown = (signal: NodeJS.Signals) => () => {
    if (shuttingDown) return;
    shuttingDown = true;
    log('shutdown started', { graceMs, signal });

    let finished = false;
    const finish = (code: number) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      exit(code);
    };

    const timer = setTimeout(() => {
      log('shutdown grace period expired; exiting');
      finish(1);
    }, graceMs);
    timer.unref?.();

    server.close((err) => {
      if (err) {
        log('server close failed', { error: err.message });
        finish(1);
        return;
      }
      if (!closeResources) {
        log('shutdown complete');
        finish(0);
        return;
      }
      closeResources().then(
        () => {
          log('shutdown complete');
          finish(0);
        },
        (e: unknown) => {
          log('closing resources failed', { error: e instanceof Error ? e.message : String(e) });
          finish(1);
        },
      );
    });
  };

  onSignal('SIGTERM', shutdown('SIGTERM'));
  onSignal('SIGINT', shutdown('SIGINT'));
};
