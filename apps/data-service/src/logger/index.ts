import type pino from 'pino';
import { compose, omit } from 'ramda';
import createLogger from './pino';
import { stringifyMetaInProd } from './utils';

const getLevelOrDefault =
  (def: string) =>
  (data: unknown): string => {
    const d = data as Record<string, unknown>;
    if (d != null && d['level'] != null) return String(d['level']);
    if (d != null && d['meta.level'] != null) return String(d['meta.level']);
    return def;
  };

// Parse and validation failures are the client's fault (HTTP 400); keep them out
// of the error level so real server errors stay visible.
const CLIENT_ERROR_TYPES = new Set(['Parse', 'Validation']);

/** Readable summary of whatever failed, without assuming an AppError shape. */
export const describeFailure = (
  data: unknown,
): { message: string; stack?: string; type: string; meta: Record<string, unknown> } => {
  const d = (data !== null && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const inner = d['error'] instanceof Error ? d['error'] : data instanceof Error ? data : undefined;
  const tag = typeof d['_tag'] === 'string' ? d['_tag'] : undefined;
  const type = typeof d['type'] === 'string' ? d['type'] : (tag ?? 'Unknown');
  const message =
    inner?.message ?? (typeof d['message'] === 'string' ? d['message'] : (tag ?? String(data)));
  const meta =
    d['meta'] !== null && typeof d['meta'] === 'object'
      ? (d['meta'] as Record<string, unknown>)
      : {};
  return inner?.stack === undefined
    ? { message, meta, type }
    : { message, meta, stack: inner.stack, type };
};

export const createEvent = ({
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
    const failure = describeFailure(data);
    return {
      level: CLIENT_ERROR_TYPES.has(failure.type) ? 'warn' : 'error',
      obj: {
        event: {
          meta: stringifyMetaInProd({
            message: failure.message,
            stack: failure.stack,
            type: failure.type,
            ...failure.meta,
          }),
          name: message,
        },
        request,
      },
    };
  } else {
    return {
      level: getLevelOrDefault('debug')(data),
      obj: {
        event: {
          meta: stringifyMetaInProd(responseTime ? omit(['responseTime'], data) : data),
          name: message,
          ...(responseTime ? { responseTime } : {}),
        },
        request,
      },
    };
  }
};

const createAndSubscribeLogger = ({ options, eventBus }: { options: any; eventBus: any }) => {
  const logger = createLogger(options);

  eventBus.on(
    'log',
    compose((x: { level: string; obj: object }) => {
      const level = x.level as pino.Level;
      logger[level](x.obj);
    }, createEvent),
  );

  return logger;
};

export default createAndSubscribeLogger;
