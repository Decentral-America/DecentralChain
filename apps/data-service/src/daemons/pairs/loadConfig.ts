import { always, memoizeWith } from 'ramda';
import { type LoggerConfig, loadDefaultConfig, type PostgresConfig } from '../../loadConfig';

export type PairsConfig = PostgresConfig &
  LoggerConfig & {
    pairsUpdateInterval: number;
    pairsUpdateTimeout: number;
  };

const load = (): PairsConfig => ({
  ...loadDefaultConfig(),
  pairsUpdateInterval: process.env['PAIRS_UPDATE_INTERVAL']
    ? parseInt(process.env['PAIRS_UPDATE_INTERVAL'], 10)
    : 2500,
  pairsUpdateTimeout: process.env['PAIRS_UPDATE_TIMEOUT']
    ? parseInt(process.env['PAIRS_UPDATE_TIMEOUT'], 10)
    : 20000,
});

export const loadConfig = memoizeWith(always('config'), load);
