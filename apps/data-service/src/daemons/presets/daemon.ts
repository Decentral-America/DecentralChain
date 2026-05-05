import Task from 'folktale/concurrency/task';
import Maybe from 'folktale/maybe';

import getErrorMessage from '../../errorHandling/getErrorMessage';
import { tap } from '../../utils/tap';

import logTaskProgress from '../utils/logTaskProgress';

/** getSleepTime :: Date -> Number ms -> Number ms */
const getSleepTime = (start, interval) => {
  const diff = interval - (new Date() - start);
  return diff < 0 ? 0 : diff;
};

/** loop :: (Object -> Task) -> Object -> Number -> Number -> Promise */
const loop = (func, cfg, interval, timeout) => {
  const startLoop = new Date();

  return Task.waitAny([
    func(cfg),
    Task.task((resolver) => {
      const timerId = setTimeout(
        () => resolver.reject(new Error('Daemon timeout expired')),
        timeout,
      );
      resolver.cleanup(() => clearTimeout(timerId));
    }),
  ])
    .run()
    .promise()
    .then(() => {
      setTimeout(() => loop(func, cfg, interval, timeout), getSleepTime(startLoop, interval));
    });
};

/** main :: Object { init, loop } -> Object -> Number ms -> Number ms -> Object { info, warn, error } -> TaskExecution */
const main = (daemon, config, interval, timeout, logger) =>
  Task.of(Maybe.fromNullable(daemon.init))
    .map(
      tap((maybeInit) =>
        maybeInit.matchWith({
          Just: () => {},
          Nothing: () =>
            logger.warn({
              message: '[DAEMON] init function not found',
            }),
        }),
      ),
    )
    .chain((maybeInit) =>
      logTaskProgress(logger)(
        {
          error: (e, timeTaken) => ({
            error: e,
            message: '[DAEMON] initialization error',
            time: timeTaken,
          }),
          start: (timeStart) => ({
            message: '[DAEMON] initialization started',
            time: timeStart,
          }),
          success: (_, timeTaken) => ({
            message: '[DAEMON] initialization successful',
            time: timeTaken,
          }),
        },
        maybeInit.getOrElse(Task.of)(config),
      ),
    )
    .map(() => Maybe.fromNullable(daemon.loop))
    .map(
      tap((maybeLoop) =>
        maybeLoop.matchWith({
          Just: () => {},
          Nothing: () =>
            logger.warn({
              message: '[DAEMON] loop function not found',
            }),
        }),
      ),
    )
    .chain((maybeLoop) =>
      logTaskProgress(logger)(
        {
          error: (e, timeTaken) => ({
            error: getErrorMessage(e),
            message: '[DAEMON] loop error',
            time: timeTaken,
          }),
          start: (timeStart) => ({
            message: '[DAEMON] loop started',
            time: timeStart,
          }),
          success: (_, timeTaken) => ({
            message: '[DAEMON] loop successfully stopped',
            time: timeTaken,
          }),
        },
        maybeLoop.matchWith({
          Just: ({ value }) =>
            Task.task((resolver) =>
              loop(value, config, interval, timeout).catch((e) => resolver.reject(e)),
            ),
          Nothing: () => Task.rejected('[DAEMON] loop function not found'),
        }),
      ),
    )
    .run()
    .listen({
      onCancelled: () =>
        logger.error({
          message: `[DAEMON] loop canceled`,
        }),
      onRejected: (error) => {
        logger.error({
          error: getErrorMessage(error),
          message: `[DAEMON] loop is stopped with error`,
        });
        process.exit(1);
      },
      onResolved: () => {
        throw '[DAEMON] loop is stopped but never should';
      },
    });

export default {
  daemon: main,
};
