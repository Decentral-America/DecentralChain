import { Effect, Option, pipe } from 'effect';

import getErrorMessage from '../../errorHandling/getErrorMessage';
import logTaskProgress from '../utils/logTaskProgress';

/** getSleepTime :: Date -> Number ms -> Number ms */
const getSleepTime = (start: Date, interval: number): number => {
  const diff = interval - (Date.now() - +start);
  return diff < 0 ? 0 : diff;
};

/** loop :: (Object -> Effect) -> Object -> Number -> Number -> Promise */
const loop = (
  func: (cfg: any) => Effect.Effect<any, any>,
  cfg: any,
  interval: number,
  timeout: number,
): Promise<void> => {
  const startLoop = new Date();

  return Effect.runPromise(
    Effect.raceAll([
      func(cfg),
      Effect.async<never, Error>((emit) => {
        const timerId = setTimeout(
          () => emit(Effect.fail(new Error('Daemon timeout expired'))),
          timeout,
        );
        return Effect.sync(() => clearTimeout(timerId));
      }),
    ]),
  )
    .then(() => {
      setTimeout(() => loop(func, cfg, interval, timeout), getSleepTime(startLoop, interval));
    })
    .catch(() => {
      // swallow: already handled inside func or timeout
    });
};

/** main :: Object { init, loop } -> Object -> Number ms -> Number ms -> Object { info, warn, error } -> Promise */
const main = (
  daemon: { init?: () => Effect.Effect<any, any>; loop: (cfg: any) => Effect.Effect<any, any> },
  config: any,
  interval: number,
  timeout: number,
  logger: { info: (msg: any) => void; warn: (msg: any) => void; error: (msg: any) => void },
): Effect.Effect<void, never> => {
  const maybeInit = Option.fromNullable(daemon.init);

  if (Option.isNone(maybeInit)) {
    logger.warn({ message: '[DAEMON] init function not found' });
  }

  const initEffect: Effect.Effect<any, any> = Option.isSome(maybeInit)
    ? logTaskProgress(logger)(
        {
          error: (e: any, timeTaken: number) => ({
            error: e,
            message: '[DAEMON] initialization error',
            time: timeTaken,
          }),
          start: (timeStart: Date) => ({
            message: '[DAEMON] initialization started',
            time: timeStart,
          }),
          success: (_r: any, timeTaken: number) => ({
            message: '[DAEMON] initialization finished',
            time: timeTaken,
          }),
        },
        maybeInit.value(),
      )
    : Effect.succeed(undefined);

  return pipe(
    initEffect,
    Effect.flatMap(() =>
      Effect.sync(() => {
        void loop(
          (cfg) =>
            logTaskProgress(logger)(
              {
                error: (e: any, timeTaken: number) => ({
                  error: getErrorMessage(e),
                  message: '[DAEMON] loop error',
                  time: timeTaken,
                }),
                start: (timeStart: Date) => ({
                  message: '[DAEMON] loop started',
                  time: timeStart,
                }),
                success: (_r: any, timeTaken: number) => ({
                  message: '[DAEMON] loop finished',
                  time: timeTaken,
                }),
              },
              daemon.loop(cfg),
            ),
          config,
          interval,
          timeout,
        );
      }),
    ),
    Effect.mapError(() => undefined as never),
  );
};

export default main;
