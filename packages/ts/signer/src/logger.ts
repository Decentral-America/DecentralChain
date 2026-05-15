/**
 * Lightweight logger module for @decentralchain/signer.
 * Zero-dependency console wrapper that respects log level filtering.
 */

export interface IConsole {
  log(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

type LogLevel = 'verbose' | 'production' | 'error';

interface LoggerOptions {
  level: LogLevel;
  prefix: string;
}

export function makeOptions(level: LogLevel | string, prefix: string): LoggerOptions {
  const validLevels: LogLevel[] = ['verbose', 'production', 'error'];
  const resolvedLevel: LogLevel = validLevels.includes(level as LogLevel)
    ? (level as LogLevel)
    : 'production';

  return { level: resolvedLevel, prefix };
}

const noop = (): void => {
  /* intentionally empty */
};

export function makeConsole(options: LoggerOptions): IConsole {
  const { level, prefix } = options;
  const tag = `[${prefix}]`;

  if (level === 'error') {
    return {
      error: (...args: unknown[]) => console.error(tag, ...args),
      info: noop,
      log: noop,
      warn: noop,
    };
  }

  if (level === 'production') {
    return {
      error: (...args: unknown[]) => console.error(tag, ...args),
      info: noop,
      log: noop,
      warn: (...args: unknown[]) => console.warn(tag, ...args),
    };
  }

  // verbose — log everything
  return {
    error: (...args: unknown[]) => console.error(tag, ...args),
    // biome-ignore lint/suspicious/noConsole: verbose mode requires console.info
    info: (...args: unknown[]) => console.info(tag, ...args),
    // biome-ignore lint/suspicious/noConsole: verbose mode requires console.log
    log: (...args: unknown[]) => console.log(tag, ...args),
    warn: (...args: unknown[]) => console.warn(tag, ...args),
  };
}
