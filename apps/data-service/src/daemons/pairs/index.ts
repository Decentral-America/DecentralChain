import { Effect } from 'effect';

import { createPgDriver } from '../../db';
import createLogger from '../../logger/winston';
import { installGracefulShutdown } from '../../shutdown';
import runDaemon, { createDaemonControl } from '../presets/daemon';
import createDaemon from './create';
import { loadConfig } from './loadConfig';

const configuration = loadConfig();

const logger = createLogger({
  logLevel: 'info',
});

const pgDriver = createPgDriver(configuration);

const control = createDaemonControl();

void Effect.runPromise(
  runDaemon(
    createDaemon({
      logger,
      pairsTableName: 'pairs',
      pg: pgDriver,
    }),
    configuration,
    configuration.pairsUpdateInterval,
    configuration.pairsUpdateTimeout,
    logger,
    control,
  ),
);

// Node is PID 1 in the container: stop scheduling, let the current iteration
// finish (bounded, under Docker's 10 s stop timeout), close the pool, exit 0.
installGracefulShutdown({
  closeResources: () => pgDriver.close(),
  exit: (code) => {
    logger.flush();
    process.exit(code);
  },
  graceMs: 8_000,
  log: (message, meta) => logger.info(meta ?? {}, message),
  onSignal: (signal, handler) => {
    process.once(signal, handler);
  },
  server: {
    close: (callback) => {
      void control.stop().then(
        () => callback?.(),
        (e: unknown) => callback?.(e instanceof Error ? e : new Error(String(e))),
      );
    },
  },
});
