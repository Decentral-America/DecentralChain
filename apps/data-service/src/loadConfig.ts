import { always, isNil, memoizeWith } from 'ramda';

const checkEnv = (vars: string[]): void => {
  const missing = vars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
};

export type PostgresConfig = {
  postgresHost: string;
  postgresPort: number;
  postgresDatabase: string;
  postgresUser: string;
  postgresPassword: string;
  postgresPoolSize: number;
  postgresStatementTimeout: number | false;
};

export type LoggerConfig = {
  logLevel: string;
};

export type ServerConfig = {
  port: number;
};

export type MatcherConfig = {
  matcher: {
    settingsURL?: string;
    defaultMatcherAddress: string;
  };
};

export type RatesConfig = {
  pairAcceptanceVolumeThreshold: number;
  thresholdAssetId: string;
  rateBaseAssetId: string;
};

export type DefaultConfig = PostgresConfig & ServerConfig & LoggerConfig;

export type DataServiceConfig = PostgresConfig &
  ServerConfig &
  LoggerConfig &
  MatcherConfig &
  RatesConfig;

const commonEnvVariables = ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];

const parsePort = (envVar: string, fallback: number): number => {
  const raw = process.env[envVar];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1 || n > 65535) {
    throw new Error(`${envVar}=${raw} is not a valid port (1–65535)`);
  }
  return n;
};

const parsePositiveInt = (envVar: string, fallback: number): number => {
  const raw = process.env[envVar];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) {
    throw new Error(`${envVar}=${raw} is not a valid positive integer`);
  }
  return n;
};

export const DEFAULT_STATEMENT_TIMEOUT_MS = 25_000;

/**
 * Postgres statement_timeout in ms. Unset: 25 s, just under the 30 s HTTP
 * timeout, so a query aborted by the HTTP layer does not keep its pool connection.
 * "0" or "false" disables it.
 */
export const parseStatementTimeout = (raw: string | undefined): number | false => {
  if (isNil(raw) || raw === '') return DEFAULT_STATEMENT_TIMEOUT_MS;
  if (raw === 'false' || raw === '0') return false;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0 || String(n) !== raw.trim()) {
    throw new Error(`PGSTATEMENTTIMEOUT=${raw} is not a valid non-negative integer (ms)`);
  }
  return n;
};

export const loadDefaultConfig = (): DefaultConfig => {
  // assert common env vars are set
  checkEnv(commonEnvVariables);

  return {
    logLevel: process.env['LOG_LEVEL'] || 'info',
    port: parsePort('PORT', 3000),
    postgresDatabase: process.env['PGDATABASE'] || 'dcc',
    postgresHost: process.env['PGHOST'] || '',
    // PGPASSWORD is in commonEnvVariables — checkEnv() above guarantees it is set.
    postgresPassword: process.env['PGPASSWORD'] ?? '',
    postgresPoolSize: parsePositiveInt('PGPOOLSIZE', 20),
    postgresPort: parsePort('PGPORT', 5432),
    postgresStatementTimeout: parseStatementTimeout(process.env['PGSTATEMENTTIMEOUT']),
    postgresUser: process.env['PGUSER'] || 'postgres',
  };
};

const envVariables = [
  'DEFAULT_MATCHER',
  'RATE_PAIR_ACCEPTANCE_VOLUME_THRESHOLD',
  'RATE_THRESHOLD_ASSET_ID',
];

const ensurePositiveNumber = (x: number, msg: string) => {
  if (x > 0) {
    return x;
  }

  throw new Error(msg);
};

const load = (): DataServiceConfig => {
  // assert all necessary env vars are set
  checkEnv(envVariables);

  const matcher: MatcherConfig = {
    matcher: {
      defaultMatcherAddress: process.env['DEFAULT_MATCHER'] as string,
    },
  };

  const volumeThreshold = ensurePositiveNumber(
    parseInt(process.env['RATE_PAIR_ACCEPTANCE_VOLUME_THRESHOLD'] as string, 10),
    'RATE_PAIR_ACCEPTANCE_VOLUME_THRESHOLD environment variable should be a positive integer',
  );

  const rate: RatesConfig = {
    pairAcceptanceVolumeThreshold: volumeThreshold,
    rateBaseAssetId: (process.env['RATE_BASE_ASSET_ID'] as string) || 'DCC',
    thresholdAssetId: process.env['RATE_THRESHOLD_ASSET_ID'] as string,
  };

  if (
    typeof process.env['MATCHER_SETTINGS_URL'] !== 'undefined' &&
    process.env['MATCHER_SETTINGS_URL'] !== ''
  ) {
    matcher.matcher.settingsURL = process.env['MATCHER_SETTINGS_URL'];
  }

  return {
    ...loadDefaultConfig(),
    ...matcher,
    ...rate,
  };
};

export const loadConfig = memoizeWith(always('config'), load);
