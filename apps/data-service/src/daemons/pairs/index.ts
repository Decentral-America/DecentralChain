import { Effect } from 'effect';

import { createPgDriver } from '../../db';
import createLogger from '../../logger/winston';
import runDaemon from '../presets/daemon';
import createDaemon from './create';
import { loadConfig } from './loadConfig';

const configuration = loadConfig();

const logger = createLogger({
  logLevel: 'info',
});

const pgDriver = createPgDriver(configuration);

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
  ),
);
