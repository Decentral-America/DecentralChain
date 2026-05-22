import { compose, omit } from 'ramda';
import { stringifyMetaInProd } from './utils';
import createLogger from './winston';

const getLevelOrDefault =
  (def: string) =>
  (data: unknown): string => {
    const d = data as Record<string, unknown>;
    if (d != null && d['level'] != null) return String(d['level']);
    if (d != null && d['meta.level'] != null) return String(d['meta.level']);
    return def;
  };

const createEvent = ({
  message,
  request,
  data,
}: {
  message: string;
  request: unknown;
  data: any;
}) => {
  // safe get response time
  const responseTime = (data as Record<string, unknown>)?.['responseTime'] ?? null;

  if (message === 'ERROR') {
    return {
      event: {
        meta: stringifyMetaInProd({
          message: data.error.message,
          stack: data.error.stack,
          type: data.type,
          ...data.meta,
        }),
        name: message,
      },
      level: 'error',
      request,
    };
  } else {
    return {
      event: {
        meta: stringifyMetaInProd(responseTime ? omit(['responseTime'], data) : data),
        name: message,
        ...(responseTime ? { responseTime } : {}),
      },
      level: getLevelOrDefault('debug')(data),
      request,
    };
  }
};

const createAndSubscribeLogger = ({ options, eventBus }: { options: any; eventBus: any }) => {
  const logger = createLogger(options);

  eventBus.on(
    'log',
    compose((x) => (logger.log as unknown as (x: object) => void)(x), createEvent),
  );

  return logger;
};

export default createAndSubscribeLogger;
