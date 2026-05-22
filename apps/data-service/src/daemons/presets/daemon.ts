import { Effect, Option, pipe } from 'effect';

import getErrorMessage from '../../errorHandling/getErrorMessage';
import logTaskProgress from '../utils/logTaskProgress';

type DaemonLogger = {
  info: (msg: unknown) => void;
  warn: (msg: unknown) => void;
  error: (msg: unknown) => void;
};

/** getSleepTime :: Date -> Number ms -> Number ms */
const getSleepTime = (start: Date, interval: number): number => {
  const diff = interval - (Date.now() - +start);
  return diff < 0 ? 0 : diff;
};

/** loop :: (Config -> Effect) -> Config -> Number -> Number -> Promise */
const loop = <Config>(
  func: (cfg: Config) => Effect.Effect<unknown, unknown>,
  cfg: Config,
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

/** main :: Object { init, loop } -> Config -> Number ms -> Number ms -> DaemonLogger -> Effect */
const main = <Config>(
  daemon: {
    init?: () => Effect.Effect<unknown, unknown>;
    loop: (cfg: Config) => Effect.Effect<unknown, unknown>;
  },
  config: Config,
  interval: number,
  timeout: number,
  logger: DaemonLogger,
): Effect.Effect<void, never> => {
  const maybeInit = Option.fromNullable(daemon.init);

  if (Option.isNone(maybeInit)) {
    logger.warn({ message: '[DAEMON] init function not found' });
  }

  const initEffect: Effect.Effect<unknown, unknown> = Option.isSome(maybeInit)
    ? logTaskProgress(logger)(
        {
          error: (e: unknown, timeTaken: number) => ({
            error: e,
            message: '[DAEMON] initialization error',
            time: timeTaken,
          }),
          start: (timeStart: Date) => ({
            message: '[DAEMON] initialization started',
            time: timeStart,
          }),
          success: (_r: unknown, timeTaken: number) => ({
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
          (cfg: Config) =>
            logTaskProgress(logger)(
              {
                error: (e: unknown, timeTaken: number) => ({
                  error: getErrorMessage(e),
                  message: '[DAEMON] loop error',
                  time: timeTaken,
                }),
                start: (timeStart: Date) => ({
                  message: '[DAEMON] loop started',
                  time: timeStart,
                }),
                success: (_r: unknown, timeTaken: number) => ({
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
