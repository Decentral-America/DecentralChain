import { createRequire } from 'node:module';

import { createPgDriver } from '../../db';
import createLogger from '../../logger/winston';
import { loadConfig } from './loadConfig';

const _require = createRequire(import.meta.url);
const { daemon: runDaemon } = _require('../presets/daemon');
const createDaemon = _require('./create');

const configuration = loadConfig();

const logger = createLogger({
  logLevel: 'info',
});

const pgDriver = createPgDriver(configuration);

runDaemon(
  createDaemon(
    {
      logger,
      pairsTableName: 'pairs',
      pg: pgDriver,
    },
    configuration,
  ),
  configuration,
  configuration.pairsUpdateInterval,
  configuration.pairsUpdateTimeout,
  logger,
);
