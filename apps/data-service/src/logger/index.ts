import createLogger from './winston';
import { stringifyMetaInProd } from './utils';
import { path,
  complement,
  isNil,
  cond,
  pathSatisfies,
  T,
  always,
  omit,
  propOr,
  compose, } from 'ramda';

const isNotNil = complement(isNil);
const isPathNotNil = pathSatisfies(isNotNil);
const pathIfNotNil = (p) => [isPathNotNil(p), path(p)];
const getLevelOrDefault = (def) =>
  cond([pathIfNotNil(['level']), pathIfNotNil(['meta.level']), [T, always(def)]]);

const createEvent = ({ message, request, data }) => {
  // safe get response time
  const responseTime = propOr(null, ['responseTime'], data);

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

const createAndSubscribeLogger = ({ options, eventBus }) => {
  const logger = createLogger(options);

  eventBus.on(
    'log',
    compose((x) => logger.log(x), createEvent),
  );
};

export default createAndSubscribeLogger;
