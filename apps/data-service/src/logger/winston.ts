import pino from 'pino';

const isDev = process.env['NODE_ENV'] === 'development';

const createLogger = (options: { logLevel: string }) =>
  pino({
    level: options.logLevel ?? 'info',
    ...(isDev && {
      transport: {
        options: { colorize: true, translateTime: 'SYS:iso' },
        target: 'pino-pretty',
      },
    }),
  });

export default createLogger;
