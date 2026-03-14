export type TConsoleMethods = 'log' | 'info' | 'warn' | 'error';

const LOG_LEVEL = {
  ERRORS: 1,
  PRODUCTION: 0,
  VERBOSE: 2,
} as const;

export const consoleConfig = {
  LOG_LEVEL,
  logLevel: LOG_LEVEL.PRODUCTION as number,
  methodsData: {
    error: { logLevel: LOG_LEVEL.ERRORS, save: true },
    info: { logLevel: LOG_LEVEL.VERBOSE, save: false },
    log: { logLevel: LOG_LEVEL.VERBOSE, save: false },
    warn: { logLevel: LOG_LEVEL.VERBOSE, save: true },
  } as Record<TConsoleMethods, { save: boolean; logLevel: number }>,
};

export const config = {
  console: consoleConfig,
};
