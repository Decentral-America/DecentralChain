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

/**
 * Lets a caller stop a running daemon: no further iterations are scheduled and
 * `stop()` resolves once the iteration in flight (if any) has settled.
 */
export type DaemonControl = {
  stop: () => Promise<void>;
};

type ControlState = {
  stopping: boolean;
  inFlight: Promise<void> | undefined;
  pendingTimer: ReturnType<typeof setTimeout> | undefined;
};

export const createDaemonControl = (): DaemonControl & { state: ControlState } => {
  const state: ControlState = { inFlight: undefined, pendingTimer: undefined, stopping: false };
  return {
    state,
    stop: async () => {
      state.stopping = true;
      if (state.pendingTimer !== undefined) clearTimeout(state.pendingTimer);
      await state.inFlight;
    },
  };
};

/** loop :: (Config -> Effect) -> Config -> Number -> Number -> Promise */
const loop = <Config>(
  func: (cfg: Config) => Effect.Effect<unknown, unknown>,
  cfg: Config,
  interval: number,
  timeout: number,
  state: ControlState,
): Promise<void> => {
  if (state.stopping) return Promise.resolve();
  const startLoop = new Date();

  // Schedule the next iteration whether this one succeeded, failed or timed out
  // (failures are already logged by logTaskProgress). Stopping here would leave
  // the process alive but never updating the pairs table again. Nothing is
  // scheduled once stop() has been called.
  const scheduleNext = (): void => {
    if (state.stopping) return;
    state.pendingTimer = setTimeout(
      () => loop(func, cfg, interval, timeout, state),
      getSleepTime(startLoop, interval),
    );
  };

  const run = Effect.runPromise(
    // raceAll only settles on the first *success*, so a failing timeout leg would
    // wait forever on a hung iteration; timeoutFail interrupts it instead.
    func(cfg).pipe(
      Effect.timeoutFail({
        duration: timeout,
        onTimeout: () => new Error('Daemon timeout expired'),
      }),
    ),
  ).then(scheduleNext, scheduleNext);
  state.inFlight = run;
  return run;
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
  control: ReturnType<typeof createDaemonControl> = createDaemonControl(),
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
          control.state,
        );
      }),
    ),
    Effect.mapError(() => undefined as never),
  );
};

export default main;
