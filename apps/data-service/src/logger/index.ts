import { always, complement, compose, cond, isNil, omit, path, pathSatisfies, T } from 'ramda';
import { stringifyMetaInProd } from './utils';
import createLogger from './winston';

const isNotNil = complement(isNil);
const isPathNotNil = pathSatisfies(isNotNil);
const pathIfNotNil = (p: string[]) => [isPathNotNil(p), path(p)];
const getLevelOrDefault = (def: string) =>
  (cond as any)([pathIfNotNil(['level']), pathIfNotNil(['meta.level']), [T, always(def)]]);

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
  const responseTime = (path as any)(['responseTime'], data) ?? null;

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
    compose((x) => (logger.log as any)(x), createEvent),
  );
};

export default createAndSubscribeLogger;
