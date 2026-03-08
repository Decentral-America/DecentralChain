export type TConsoleMethods = 'log' | 'info' | 'warn' | 'error';

export const LOG_LEVEL = {
  PRODUCTION: 0,
  ERRORS: 1,
  VERBOSE: 2,
} as const;

export const consoleConfig = {
  LOG_LEVEL,
  logLevel: LOG_LEVEL.PRODUCTION as number,
  methodsData: {
    log: { save: false, logLevel: LOG_LEVEL.VERBOSE },
    info: { save: false, logLevel: LOG_LEVEL.VERBOSE },
    warn: { save: true, logLevel: LOG_LEVEL.VERBOSE },
    error: { save: true, logLevel: LOG_LEVEL.ERRORS },
  } as Record<TConsoleMethods, { save: boolean; logLevel: number }>,
};

export const config = {
  console: consoleConfig,
};
