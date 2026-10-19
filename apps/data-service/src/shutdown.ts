/**
 * Graceful shutdown for the HTTP server.
 *
 * On SIGTERM/SIGINT: stop accepting connections, let in-flight requests finish,
 * then exit 0. If they do not finish within `graceMs` (keep it under Docker's
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
};

export const installGracefulShutdown = ({
  server,
  log,
  exit,
  onSignal,
  graceMs,
}: ShutdownDeps): void => {
  let shuttingDown = false;

  const shutdown = (signal: NodeJS.Signals) => () => {
    if (shuttingDown) return;
    shuttingDown = true;
    log('shutdown started', { graceMs, signal });

    const timer = setTimeout(() => {
      log('shutdown grace period expired; exiting');
      exit(1);
    }, graceMs);
    timer.unref?.();

    server.close((err) => {
      clearTimeout(timer);
      if (err) {
        log('server close failed', { error: err.message });
        exit(1);
        return;
      }
      log('shutdown complete');
      exit(0);
    });
  };

  onSignal('SIGTERM', shutdown('SIGTERM'));
  onSignal('SIGINT', shutdown('SIGINT'));
};
